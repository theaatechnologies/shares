# Shares Buying/Selling Microservice via Grape server

# Environment 
```
node -v 
v14.17.3
```

# Start Grape server nodes as
```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002' 
```
```
grape --dp 20002 --aph 30002 --bn '127.0.0.1:20001' 
```

# Example Simulation Run

## Install npm dependencies
```
npm install
```

## First client
npm run client 6 buy tesla 1

```
> tsnd --respawn client.ts "6" "buy" "tesla" "1"

[INFO] 18:02:34 ts-node-dev ver. 1.1.8 (using ts-node ver. 9.1.1, typescript ver. 4.7.4)
Command line arguments  6 buy tesla 1
b3340ba2-5c13-4d3c-bb44-864a0986fe04 broadcast {
event: 'create',
data: {
id: 'fa54d8ed-4857-4dbd-95e6-15086f174748',
seller: '230c71cd-dda7-456a-9b26-423dcfb3218b',
type: 'buy',
amount: '1',
code: 'TESLA'
}
}
```

## Second client
npm run client 7 sell tesla 1

```
> tsnd --respawn client.ts "7" "sell" "tesla" "1"

[INFO] 18:03:48 ts-node-dev ver. 1.1.8 (using ts-node ver. 9.1.1, typescript ver. 4.7.4)
Command line arguments  7 sell tesla 1
7c01f98d-1f3f-4cb0-a155-cf1cc4cb84c6 broadcast {
event: 'create',
data: {
id: 'dca4edb3-42b5-41fa-8d45-534e402cdf22',
seller: 'fb5faa63-af5b-4718-873d-305215e41336',
type: 'sell',
amount: '1',
code: 'TESLA'
}
}
51d82785-e1a7-4c8d-9080-a9a3d5be0278 clientfb5faa63-af5b-4718-873d-305215e41336 {
event: 'accept',
data: {
id: 'dca4edb3-42b5-41fa-8d45-534e402cdf22',
seller: 'fb5faa63-af5b-4718-873d-305215e41336',
buyer: '230c71cd-dda7-456a-9b26-423dcfb3218b'
}
}
51d82785-e1a7-4c8d-9080-a9a3d5be0278 Notify buyer:230c71cd-dda7-456a-9b26-423dcfb3218b about accept
```

## State of first client after the execution of second client request

```
$ npm run client 6 buy tesla 1

> tsnd --respawn client.ts "6" "buy" "tesla" "1"

[INFO] 18:02:34 ts-node-dev ver. 1.1.8 (using ts-node ver. 9.1.1, typescript ver. 4.7.4)
Command line arguments  6 buy tesla 1
b3340ba2-5c13-4d3c-bb44-864a0986fe04 broadcast {
event: 'create',
data: {
id: 'fa54d8ed-4857-4dbd-95e6-15086f174748',
seller: '230c71cd-dda7-456a-9b26-423dcfb3218b',
type: 'buy',
amount: '1',
code: 'TESLA'
}
}
b698d7ac-d6d7-4c5c-a5ba-5af99aeec561 broadcast {
event: 'create',
data: {
id: 'dca4edb3-42b5-41fa-8d45-534e402cdf22',
seller: 'fb5faa63-af5b-4718-873d-305215e41336',
type: 'sell',
amount: '1',
code: 'TESLA'
}
}
b698d7ac-d6d7-4c5c-a5ba-5af99aeec561 Received new order:dca4edb3-42b5-41fa-8d45-534e402cdf22 from seller:fb5faa63-af5b-4718-873d-305215e41336 checking our orders...
b698d7ac-d6d7-4c5c-a5ba-5af99aeec561 Propose has been received by seller:fb5faa63-af5b-4718-873d-305215e41336
363b6e2e-9a36-4393-b0d5-4aacb4d4256d client230c71cd-dda7-456a-9b26-423dcfb3218b {
event: 'approved',
data: {
id: 'dca4edb3-42b5-41fa-8d45-534e402cdf22',
seller: 'fb5faa63-af5b-4718-873d-305215e41336',
buyer: '230c71cd-dda7-456a-9b26-423dcfb3218b'
}
}
```
