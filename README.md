# GRIP Interface Library for JavaScript

Authors: Katsuyuki Ohmuro <harmony7@pex2.jp>, Konstantin Bokarius <kon@fanout.io>

## [Planned for 3.0.0]
- Major update with great improvements in usability, with support for modern
  language features such as `class` and `async`/`await`.  Collapses js-pubcontrol into
  js-grip, simplifying use and deployment.
- Reorganized utility functions into categorized files.

## Description

A GRIP interface library for NodeJS.  For use with HTTP reverse proxy servers
that support the GRIP interface, such as Pushpin.

## Installation

```sh
npm install @fanoutio/grip
```

## Sample Usage

Examples for how to publish HTTP response and HTTP stream messages to GRIP proxy endpoints via the Publisher class.

```javascript
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

// Publisher can be initialized with or without an endpoint configuration.
// Each endpoint can include optional JWT authentication info.
// Multiple endpoints can be included in a single configuration.

var grippub = new grip.Publisher({
        'control_uri': 'https://api.fanout.io/realm/<myrealm>',
        'control_iss': '<myrealm>',
        'key': Buffer.from('<myrealmkey>', 'base64')});

// Add new endpoints by applying an endpoint configuration:
grippub.applyGripConfig([{'control_uri': '<myendpoint_uri_1>'},
        {'control_uri': '<myendpoint_uri_2>'}]);

// Remove all configured endpoints:
grippub.removeAllClients();

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

    const gripInstruct = new grip.GripInstruct();
    gripInstruct.setHoldLongPoll();

    // Instruct the client to long poll via the response body:
    res.writeHead(200, gripInstruct.toHeaders());
    
    res.end('[start longpoll]');
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
var grip = require('@fanoutio/grip');

ws.createServer(function (conn) {
     // Subscribe the WebSocket to a channel:
    conn.sendText('c:' + grip.webSocketControlMessage(
            'subscribe', {'channel': '<channel>'}));

    // Wait and then publish a message to the subscribed channel:
    setTimeout(function() {
        var grippub = new grip.Publisher({
                'control_uri': '<myendpoint>'});
        grippub.publish('test_channel', new grip.Item(
                new grip.WebSocketMessageFormat(
                'Test WebSocket Publish!!')));
    }, 5000);
}).listen(80, '0.0.0.0');

console.log('Server running...');
```

WebSocket over HTTP example. In this case, a client connects to a GRIP proxy via WebSockets and the GRIP proxy communicates with the origin via HTTP.

```javascript
var http = require('http');
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
                var grippub = new grip.Publisher({
                        'control_uri': '<myendpoint>'});
                grippub.publish('channel', new grip.Item(
                        new grip.WebSocketMessageFormat(
                        'Test WebSocket Publish!!')));
            }, 5000);
        }
    });
}).listen(80, '0.0.0.0');

console.log('Server running...');
```

## Using the API

All of the APIs exposed on the root object, so for example you can bring them in
as follows:

```javascript
const { createWebSocketControlMessage, Publisher, Format, Item } = require('@fanoutio/grip');
```

or

```javascript
import { createWebSocketControlMessage, Publisher, Format, Item } from '@fanoutio/grip';
```


## API

The API exports the following functions, classes, and interfaces.

| Function | Description |
| --- | --- |
| `validateSig(token, key)` | Validate the specified JWT token and key. |
| `encodeWebSocketEvents(events)` | Encode the specified array of WebSocketEvent instances. |
| `decodeWebSocketEvents(body)` | Decode the specified HTTP request body into an array of WebSocketEvent instances when using the WebSocket-over-HTTP protocol. |
| `createGripChannelHeader(channels)` | Create a GRIP channel header for the specified channels. |
| `parseGripUri(uri)` | Parse the specified GRIP URI into a config object that can then be passed to the Publisher class. |
| `createWebSocketControlMessage(type, args)` | Generate a WebSocket control message with the specified type and optional arguments. |

| Class | Description |
| --- | --- |
| `GripInstruct` | Class used to create the necessary HTTP headers that instruct the Grip proxy to hold connections. |
| `Publisher` | Main object used to publish HTTP response and HTTP Stream format messages to Grip proxies. |
| `HttpStreamFormat` | Format used to publish messages to HTTP stream clients connected to a GRIP proxy. |
| `HttpResponseFormat` | Format used to publish messages to HTTP response clients connected to a GRIP proxy. |
| `WebSocketContext` | WebSocket context |
| `WebSocketEvent` | WebSocket event |
| `WebSocketMessageFormat` | Format used to publish messages to Web Socket clients connected to a GRIP proxy. |
| `Format` | Base class for Format used to publish messages with `Publisher`. |
| `Item` | Base class for Item used to publish messages with `Publisher`. |

| Interfaces | Description |
| --- | --- |
| `IGripConfig` | Represents a Grip client's configuration |
| `IFormat` | Represents a publishing format to be used with Publisher |
| `IItem` | Represents a container used to contain a data object in one or more formats |

Additionally, the following are exported for their types and use with code completion but with most uses of the library
the consumer rarely needs to instantiate or use them directly.

| Class | Description |
| --- | --- |
| `Auth.Basic` | Represents Basic authentication to be used with `Publisher`. |
| `Auth.Jwt` | Represents JWT authentication to be used with `Publisher`. |
| `Auth.Base` | Base class for authentication to be used with `Publisher`. |
| `Channel` | Represents a channel used by a Grip proxy. |
| `Response` | Represents a set of HTTP response data. |
| `PublisherClient` | Represents an endpoint and its attributes, including authentication, used with `Publisher`. |

| Interfaces | Description |
| --- | --- |
| `IExportedChannel` | A representation of a channel, containing the name and previous ID value|
| `IExportedResponse` | A representation of all of the non-null data from a Response |
| `IWebSocketEvent` | Decscribes information about a WebSocket event |
| `IFormatExport` | Represents a format-specific hash containing the required format-specific data|
| `IItemExport` | Describes an item that has been serialized for export |
| `IPublisherConfig` | Represents an EPCP client's configuration |
| `IPublisherCallback` | (May not be needed anymore) |

Class `GripInstruct`

| Method | Description |
| --- | --- |
| constructor(`channels?`) | Create a `GripInstruct` instance, configuring it with an optional array of channels to bind to. |
| `addChannel(channels)` | Bind to additional channels. |
| `setHoldLongPoll(timeout?)` | Set the `Grip-Hold` header to the `response` value, and specify an optional timeout value. |
| `setHoldStream()` | Set the `Grip-Hold` header to the `stream` mode. |
| `setKeepAlive(data, timeout)` | Set the `Grip-Keep-Alive` header to the specified data value and timeout value. The value for `data` may be provided as either a string or `Buffer`, and the appropriate encoding will be performed. |
| `setNextLink(uri, timeout?)` | Set the `Grip-Link` header to the specified uri, with an optional timeout value. |
| `meta` (property) | A property to be set directly on the instance. This is serialized into the `Grip-Set-Meta` header. |
| `toHeaders(params)` | Turns the current instance into an object that can be sent as HTTP headers. |

Class `Publisher`

| Method | Description |
| --- | --- |
| constructor(`configs`) | Create a `Publisher` instance, configuring it with clients that based on the specified GRIP or publisher settings. |
| `applyConfig(configs)` | Apply additional clients based on specified Grip or publisher configs to the publisher instance. |
| `removeAllClients()` | Remove all clients from this publisher instance. |
| `async publish(channel, item)` | Publish an item to the specified channel. |
| `async publishHttpResponse(channel, data, id?, prevId?)` | Publish an HTTP response format message to the specified channel, with optional ID and previous ID. |
| `async publishHttpStream(channel, item)` | Publish an HTTP stream format message to the specified channel, with optional ID and previous ID. |
| `addClient(client)` | Advanced: Add a PublisherClient instance that you have configured on your own. |

The constructor and `applyConfig` methods accept either a single object or an array of objects that implement
the `IGripConfig` interface (or in advanced cases, the `IPublisherConfig` interface).

Interface `IGripConfig`

Represents the configuration for a Grip client, such as Pushpin or Fanout Cloud.

| Field | Description |
| --- | --- |
| `control_uri` | The Control URI of the Grip client. |
| `control_iss` | (optional) The Control ISS, if required by the Grip client. |
| `key` | (optional) The key to use with the Control ISS, if required by the Grip client. |

Class `Format`

A base class for all publishing formats that are included in the Item class.
Examples of format implementations include JsonObjectFormat and HttpStreamFormat.



### Advanced APIs

Interface `IPublisherConfig`

Represents the configuration for an EPCP publisher client, not limited to
Grip clients.

| Field | Description |
| --- | --- |
| `control_uri` | The URI of the client. |
| `control_iss` | (optional) The ISS, if required by the client. |
| `key` | (optional) The key to use with the ISS, if required by the client. |

Class `PublisherClient`

Represents an endpoint and its configuration, including authentication, that
is used by `Publisher` to publish messages to.  This class is typically not used
directly, but you may instantiate this on your own if you wish to set up authentication
directly.

| Method | Description |
| --- | --- |
| constructor(`uri`) | Create a `PublisherClient` instance, initializing it with the given publishing endpoint. |
| `setAuthBasic(username, password)` | Configure this instance with Basic authentication with the specified username and password. |
| `setAuthJwt(token)`<br />`setAuthJwt(claim, key?)` | Configure this instance with Jwt authentication with the specified claim and key, or with the specified token. |
| `async publish(channel, item)` | Publish a specified item to the specified channel. |  

Class `Auth.Base`

An abstract class that represents authentication to be used with a `PublisherClient`.

Class `Auth.Basic`

Represents Basic authentication to be used with a `PublisherClient`.

Class `Auth.Jwt`

Represents JWT (JSON Web Tokens) authentication to be used with a `PublisherClient`.

## Configuring the GRIP endpoint

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
const grippub = new grip.Publisher({control_uri: "<endpoint_uri>"});
```

If you are building a bundle, you may also import in your JavaScript.

```javascript
import grip from '@fanoutio/grip';
const pub = new grip.Publisher({control_uri: "<endpoint_uri>"});
```

This package comes with full TypeScript type definitions, so you may use it with
TypeScript as well.

```javascript
import grip, { IGripConfig } from '@fanoutio/grip';
const pub = new grip.Publisher({control_uri: "<endpoint_uri>"});

// IGripConfig is a type declaration.
```

### Demos


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
node demo/grip/server
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
curl http://localhost:7999/stream
```
7. In another terminal window, run the publish demo file.
```
node demo/grip/publish test "Message"
```
8. In the window that you opened in step 6, you should see the test message.

### Browser Demo

This demo runs in a browser and streams from the endpoint. This demo
uses the fetch API with its ReadableStream interface to read from the
streaming endpoint.

1. Follow Steps 1 through 5 in the demo above to start the server and
proxy processes. 

2. In a web browser, open the `demo/grip/fetch.html` file.

3. Click the button labeled `Go`.  The browser will connect to the
streaming API at `http://localhost:7999/stream`.

4. In another terminal window follow step 7 in the demo above.

5. In the web browser that you opened in step 2, you should see the test
message.

## License

(C) 2015, 2020 Fanout, Inc.  
Licensed under the MIT License, see file COPYING for details.
