const async = require('async')
const Link = require('grenache-nodejs-link')
const findKey = require('lodash.findkey');
const {PeerRPCServer, PeerRPCClient} = require('grenache-nodejs-http')
import {v4 as uuidv4} from 'uuid';

/**
 * Implements a Basic exchange to buy and sell stock.
 */
export class Exchange {
    private broadcastKey = 'broadcast'
    private clientKey = 'client'
    private id: any;
    private port: number;
    private interval: any;
    private orders: {};
    private processOrders: {};
    private link: any;
    private clients: any;
    private serverPeer: any;
    private msgHandlers: Record<any, any>;
    private service: any;
    constructor({grapeUrl, port}) {
        this.id = uuidv4()
        this.port = Number(port)
        this.orders = {}
        this.processOrders = {}

        this.initClients(grapeUrl);

        this.initServer();
    }

    private initClients(grapeUrl) {
        this.link = new Link({
            grape: grapeUrl
        })
        this.link.start()

        this.clients = new PeerRPCClient(this.link, {})
        this.clients.init()
    }

    private initServer() {
        this.serverPeer = new PeerRPCServer(this.link, {timeout: 300000})
        this.serverPeer.init()
        this.service = this.serverPeer.transport('server')
        this.service.listen(this.port)
        this.service.on('request', this.handleRequest.bind(this))

        this.msgHandlers = {
            [this.clientKey + this.id]: {
                'accept': this.accept.bind(this),
            },
            [this.broadcastKey]: {
                'create': this.create.bind(this),
            }
        }
    }

    /**
     * create order handler.
     * @param type the type of order buy/sell.
     * @param code the code of stock.
     * @param amount the quantity.
     * @param cb the callback.
     */
    createOrder({type, code, amount}, cb) {
        type = type.toLowerCase()
        code = code.toUpperCase()
        const payload = {
            event: 'create',
            data: {
                id: uuidv4(),
                seller: this.id,
                type,
                amount,
                code
            }
        }
        this.orders[payload.data.id] = {
            contents: payload.data,
            flags: {
                inProcess: false,
                approved: false
            }
        }
        this.clients.map(this.broadcastKey, payload, {timeout: 10000}, cb)
    }

    accept(rid, data, handler) {
        const order = this.orders[data.id]

        if (!order) {
            return handler.reply(new Error('The offer has not been found'))
        }

        if (order.flags.approved) {
            return handler.reply(null, false)
        }

        handler.reply(null, true)
        if (!this.processOrders[data.id]) {
            this.processOrders[data.id] = []
        }
        this.processOrders[data.id].push(data)
        if (!order.flags.inProcess) {
            order.flags.inProcess = true
            this.process(rid, data.id, (err, approved) => {
                order.flags.approved = approved
                order.flags.inProcess = false
                this.processOrders[data.id] = []
                if (approved) {
                    delete this.orders[order.contents.id]
                }
            })
        }
    }

    create(rid, data, handler) {
        handler.reply()
        if (data.seller === this.id) {
            return
        }
        console.log(rid, `Received new order:${data.id} from seller:${data.seller} checking our orders...`)
        const matchingKeyOrder = findKey(this.orders, ({ contents }) => {
            if (contents.code === data.code && contents.amount === data.amount &&
                ((contents.type === 'sell' && data.type === 'buy') || (contents.type === 'buy' && data.type === 'sell'))
            ) {
                return true
            }
            return false
        })

        const payload = {
            event: 'accept',
            data: {
                id: data.id,
                seller: data.seller,
                buyer: this.id
            }
        }
        this.clients.request(this.clientKey + data.seller, payload, {timeout: 10000}, (err, res) => {
            if (err) {
                return
            }
            if (res) {
                console.log(rid, `Propose has been received by seller:${data.seller}`)
                return
            }

            console.log(rid, 'Offer already accepted')
        })
    }

    handleRequest(id, key, payload, handler) {
        console.log(id, key, payload)
        const {event, data} = payload
        if (!event || !data) {
            return
        }
        const eventHandler = this.msgHandlers[key] && this.msgHandlers[key][event]

        if (!eventHandler) {
            return
        }

        return eventHandler(id, data, handler)
    }

    process(rid, id, cb) {
        const processOffer = () => {
            const proposal = this.processOrders[id].shift()
            if (proposal) {
                const payload = {
                    event: 'approved',
                    data: {
                        id: proposal.id,
                        seller: proposal.seller,
                        buyer: proposal.buyer
                    }
                }
                console.log(id, `Notify buyer:${proposal.buyer} about accept`)
                this.clients.request(this.clientKey + proposal.buyer, payload, {timeout: 10000}, err => {
                    console.log('Approved for', proposal.from, rid)
                    cb(null, true)
                })
            } else {
                setImmediate(() => {
                    if (this.processOrders[id].length) {
                        return processOffer()
                    }
                    cb(null, false)
                })
            }
        }

        processOffer()
    }

    start(cb) {
        async.parallel(
            [
                cb => this.link.announce(this.clientKey + this.id, this.service.port, {}, cb),
                cb => this.link.announce(this.broadcastKey, this.service.port, {}, cb)
            ],
            (err) => {
                if (!err) {
                    this.interval = setInterval(() => {
                        this.link.announce(this.clientKey + this.id, this.service.port, {})
                        this.link.announce(this.broadcastKey, this.service.port, {})
                    }, 7000)
                }
                cb(err)
            }
        )
    }
}