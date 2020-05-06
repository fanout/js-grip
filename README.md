# GRIP Interface Library for JavaScript

Authors: Katsuyuki Ohmuro <harmony7@pex2.jp>, Konstantin Bokarius <kon@fanout.io>

## Description

A GRIP interface library for NodeJS.  For use with HTTP reverse proxy servers
that support the GRIP interface, such as Pushpin.

## Installation

```sh
npm install @fanoutio/grip
```

## Sample Usage

Examples for how to publish HTTP response and HTTP stream messages to GRIP proxy endpoints via the GripPubControl class.

```javascript
var pubcontrol = require('@fanoutio/pubcontrol');
var grip = require('@fanoutio/grip');

var callback = function(success, message, context) {
    if (success) {
        console.log('Publish successful!');
    }
    else {
        console.log("Publish failed!");
        console.log("Message: " + message);
        console.log("Context: ");
        console.dir(context);
    }
};

// GripPubControl can be initialized with or without an endpoint configuration.
// Each endpoint can include optional JWT authentication info.
// Multiple endpoints can be included in a single configuration.

var grippub = new grip.GripPubControl({
        'control_uri': 'https://api.fanout.io/realm/<myrealm>',
        'control_iss': '<myrealm>',
        'key': Buffer.from('<myrealmkey>', 'base64')});

// Add new endpoints by applying an endpoint configuration:
grippub.applyGripConfig([{'control_uri': '<myendpoint_uri_1>'},
        {'control_uri': '<myendpoint_uri_2>'}]);

// Remove all configured endpoints:
grippub.removeAllClients();

// Explicitly add an endpoint as a PubControlClient instance:
var pubclient = new pubcontrol.PubControlClient('<myendpoint_uri>');
// Optionally set JWT auth: pubclient.setAuthJwt(<claim>, '<key>');
// Optionally set basic auth: pubclient.setAuthBasic('<user>', '<password>');
grippub.addClient(pubclient);

// Publish across all configured endpoints:
grippub.publishHttpResponse('<channel>', 'Test Publish!', callback);
grippub.publishHttpStream('<channel>', 'Test Publish!', callback);
```

Validate the Grip-Sig request header from incoming GRIP messages. This ensures that the message was sent from a valid
source and is not expired. Note that when using Fanout.io the key is the realm key, and when using Pushpin the key
is configurable in Pushpin's settings.

```javascript
var grip = require('grip');

var isValid = grip.validateSig(req.headers['grip-sig'], '<key>');
```

Long polling example via response _headers_. The client connects to a GRIP proxy over HTTP and the proxy forwards the
request to the origin. The origin subscribes the client to a channel and instructs it to long poll via the response
_headers_. Note that with the recent versions of Apache it's not possible to send a 304 response containing custom
headers, in which case the response body should be used instead (next usage example below).

```javascript
var http = require('http');
var grip = require('@fanoutio/grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], '<key>')) {
        res.writeHead(401);
        res.end('invalid grip-sig token');
        return;
    }

    // Instruct the client to long poll via the response headers:
    res.writeHead(200, {
            'Grip-Hold': 'response',
            // To optionally set a timeout value in seconds:
            // 'Grip-Timeout': <timeout_value>,
            'Grip-Channel': grip.createGripChannelHeader('<channel>')});
    res.end();
}).listen(80, '0.0.0.0');

console.log('Server running...')
```

Long polling example via response _body_. The client connects to a GRIP proxy over HTTP and the proxy forwards the
request to the origin. The origin subscribes the client to a channel and instructs it to long poll via the response
_body_.

```javascript
var http = require('http');
var grip = require('@fanoutio/grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], '<key>')) {
        res.writeHead(401);
        res.end('invalid grip-sig token');
        return;
    }

    // Instruct the client to long poll via the response body:
    res.writeHead(200, {'Content-Type': 'application/grip-instruct'});
    res.end(grip.createHoldResponse('<channel>'));
    // Or to optionally set a timeout value in seconds:
    // res.end(grip.createHoldResponse('<channel>', null, <timeout_value>));
}).listen(80, '0.0.0.0');

console.log('Server running...')
```

WebSocket example using nodejs-websocket. A client connects to a GRIP proxy via WebSockets and the proxy forward the request to the origin. The origin accepts the connection over a WebSocket and responds with a control message indicating that the client should be subscribed to a channel. Note that in order for the GRIP proxy to properly interpret the control messages, the origin must provide a 'grip' extension in the 'Sec-WebSocket-Extensions' header. To accomplish this with nodejs-websocket, edit Connection.js and ensure that the following header is appended to the 'this.socket.write()' function call in the answerHandshake() method: 'Sec-WebSocket-Extensions: grip; message-prefix=""\r\n' To accomplish this with ws, add the ws.on('headers', ...) check to your app, for example:

```javascript
wss.on('headers', function processHeaders(headers, req) {
    headers.push('Sec-WebSocket-Extensions: grip; message-prefix=""');
});

...

server.on('upgrade', function upgrade(request, socket, head) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
    });
});
```

```javascript
var ws = require("nodejs-websocket")
var pubcontrol = require('@fanoutio/pubcontrol');
var grip = require('@fanoutio/grip');

ws.createServer(function (conn) {
     // Subscribe the WebSocket to a channel:
    conn.sendText('c:' + grip.webSocketControlMessage(
            'subscribe', {'channel': '<channel>'}));

    // Wait and then publish a message to the subscribed channel:
    setTimeout(function() {
        var grippub = new grip.GripPubControl({
                'control_uri': '<myendpoint>'});
        grippub.publish('test_channel', new pubcontrol.Item(
                new grip.WebSocketMessageFormat(
                'Test WebSocket Publish!!')));
    }, 5000);
}).listen(80, '0.0.0.0');

console.log('Server running...');
```

WebSocket over HTTP example. In this case, a client connects to a GRIP proxy via WebSockets and the GRIP proxy communicates with the origin via HTTP.

```javascript
var http = require('http');
var pubcontrol = require('@fanoutio/pubcontrol');
var grip = require('@fanoutio/grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], 'changeme')) {
        res.writeHead(401);
        res.end('invalid grip-sig token');
        return;
    }

    // Set the headers required by the GRIP proxy:
    res.writeHead(200, {
            'Sec-WebSocket-Extensions': 'grip; message-prefix=""',
            'Content-Type': 'application/websocket-events'});

    var body = '';
    req.on('data', function (chunk) {
        body += chunk;
    });

    req.on('end', function() {
        var inEvents = grip.decodeWebSocketEvents(body);
        if (inEvents[0].getType() == 'OPEN') {
            // Open the WebSocket and subscribe it to a channel:
            var outEvents = [];
            outEvents.push(new grip.WebSocketEvent('OPEN'));
            outEvents.push(new grip.WebSocketEvent('TEXT', 'c:' +
                    grip.webSocketControlMessage('subscribe',
                    {'channel': 'channel'})));
            res.end(grip.encodeWebSocketEvents(outEvents));

            // Wait and then publish a message to the subscribed channel:
            setTimeout(function() {
                var grippub = new grip.GripPubControl({
                        'control_uri': '<myendpoint>'});
                grippub.publish('channel', new pubcontrol.Item(
                        new grip.WebSocketMessageFormat(
                        'Test WebSocket Publish!!')));
            }, 5000);
        }
    });
}).listen(80, '0.0.0.0');

console.log('Server running...');
```

Parse a GRIP URI to extract the URI, ISS, and key values. The values will be returned in a dictionary containing 'control_uri', 'control_iss', and 'key' keys.

```javascript
var grip = require('@fanoutio/grip');
var config = grip.parseGripUri('http://api.fanout.io/realm/<myrealm>' +
        '?iss=<myrealm>&key=base64:<myrealmkey>');
```

## Consuming this library

### CommonJS

The CommonJS version of this package requires Node v8 or newer.

Require in your JavaScript:

```javascript
const grip = require('@fanoutio/grip');
const grippub = new grip.GripPubControl({control_uri: "<endpoint_uri>"});
```

If you are building a bundle, you may also import in your JavaScript.

```javascript
import grip from '@fanoutio/grip';
const pub = new grip.GripPubControl({control_uri: "<endpoint_uri>"});
```

This package comes with full TypeScript type definitions, so you may use it with
TypeScript as well.

```javascript
import grip, { IHoldInstruction } from '@fanoutio/grip';
const pub = new grip.GripPubControl({control_uri: "<endpoint_uri>"});

// IHoldInstruction is a type declaration.
```

### Demo

Included in this package is a demo that publishes a message using a Grip Stream
to a sample server that is proxied behind the open-source Pushpin (https://pushpin.org/) server.

To run the demo:

1. Clone this repository, then build the commonjs build of this library
```
npm install
npm run build-commonjs
```

2. Start the server process.  This runs on `localhost:3000`.
```
node demo/server
```

3. Install Pushpin (see https://pushpin.org/docs/install/)
4. Make sure Pushpin points to `localhost:3000`.
`routes` file:
```
* localhost:3000
```
5. Start Pushpin.
```
pushpin
```
6. In another terminal window, open a long-lived connection to the
pushpin stream.
```
curl http://localhost:7999/long-poll
```
7. In another terminal window, run the publish demo file.
```
node demo/publish test "Message"
```
8. In the window that you opened in step 6, you should see the test message.

### Browser Demo

This demo runs in a browser and streams from the endpoint. This demo
uses the fetch API with its ReadableStream interface to read from the
streaming endpoint.

1. Follow Steps 1 through 5 in the demo above to start the server and
proxy processes. 

2. In a web browser, open the `demo/fetch.html` file.

3. Click the button labeled `Go`.  The browser will connect to the
streaming API at `http://localhost:7999/long-poll`.

4. In another terminal window follow step 7 in the demo above.

5. In the web browser that you opened in step 2, you should see the test
message.

## License

(C) 2015, 2020 Fanout, Inc.  
Licensed under the MIT License, see file COPYING for details.
