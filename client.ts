import {Exchange} from "./exchange"

export var grapesNodes = [
    {
        dht_port: 20001,
        api_port: 30001,
        bootstrap: [
            '127.0.0.1:20002'
        ],
    },
    {
        dht_port: 20002,
        api_port: 30002,
        bootstrap: [
            '127.0.0.1:20001'
        ],
    },
]

const [, , port, type, code, amount] = process.argv

console.log("Command line arguments ", port, type, code, amount)

// TODO, implement round robin to use all the servers.
const grapeUrl = 'http://' + grapesNodes?.[0].bootstrap?.[0].split(':')[0] + ':' + grapesNodes?.[0].api_port
const client = new Exchange({grapeUrl, port})

client.start((err) => {

    if (!type || !amount || !code) {
        console.log('Please input parameters like "port buy apple 2"')
        process.exit(1)
    }

    client.createOrder({type, amount, code}, (err) => {})
})
