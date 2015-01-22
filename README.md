GRIP Interface Library for NodeJS
============================================

Version: v 1.0.0  
Date: January 21th, 2015  
Authors: Katsuyuki Ohmuro <harmony7@pex2.jp>, Konstantin Bokarius <kon@fanout.io>

Description
-----------

A GRIP interface library for NodeJS.  For use with HTTP reverse proxy servers
that support the GRIP interface, such as Pushpin.

This library supports the following GRIP features:

* hold-response
* hold-stream
* publish-response
* publish-stream

Requirements
------------

    pubcontrol

Sample Usage
------------

Examples for how to publish HTTP response and HTTP stream messages to GRIP proxy endpoints via the GripPubControl class.

```javascript
var pubcontrol = require('pubcontrol');
var grip = require('grip');

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
        'key': new Buffer('<myrealmkey>', 'base64')});

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

Validate the Grip-Sig request header from incoming GRIP messages. This ensures that the message was sent from a valid source and is not expired. Note that when using Fanout.io the key is the realm key, and when using Pushpin the key is configurable in Pushpin's settings.

```javascript
var grip = require('grip');

var isValid = grip.validateSig(req.headers['grip-sig'], '<key>');
```

Long polling example via response _headers_. The client connects to a GRIP proxy over HTTP and the proxy forwards the request to the origin. The origin subscribes the client to a channel and instructs it to long poll via the response _headers_. Note that with the recent versions of Apache it's not possible to send a 304 response containing custom headers, in which case the response body should be used instead (next usage example below).

```javascript
var http = require('http');
var grip = require('grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], '<key>')) {
        return;
    }

    // Instruct the client to long poll via the response headers:
    res.writeHead(200, {
            'Grip-Hold': 'response',
            'Grip-Channel': grip.createGripChannelHeader('<channel>')});
    res.end();
}).listen(80, '0.0.0.0');

console.log('Server running...')
```

Long polling example via response _body_. The client connects to a GRIP proxy over HTTP and the proxy forwards the request to the origin. The origin subscribes the client to a channel and instructs it to long poll via the response _body_.

```javascript
var http = require('http');
var grip = require('grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], '<key>')) {
        return;
    }

    // Instruct the client to long poll via the response body:
    res.writeHead(200, {'Content-Type': 'application/grip-instruct'});
    res.end(grip.createHoldResponse('<channel>'));
}).listen(80, '0.0.0.0');

console.log('Server running...')
```

WebSocket example using the Tornado 4.0.2 module. A client connects to a GRIP proxy via WebSockets and the proxy forward the request to the origin. The origin accepts the connection over a WebSocket and responds with a control message indicating that the client should be subscribed to a channel. Note that in order for the GRIP proxy to properly interpret the control messages, the origin must provide a 'grip' extension in the 'Sec-WebSocket-Extensions' header. This is accomplished by overriding the 'get' method in the handler and implementing a custom WebSocketProtocol class. Also note that a significant amount of code was removed from the 'get' and '_accept_connection' methods for the sake of readability and should be replaced if using this code in a real environment.

```javascript
```

WebSocket over HTTP example. In this case, a client connects to a GRIP proxy via WebSockets and the GRIP proxy communicates with the origin via HTTP.

```javascript
```

Parse a GRIP URI to extract the URI, ISS, and key values. The values will be returned in a dictionary containing 'control_uri', 'control_iss', and 'key' keys.

```javascript
var grip = require('grip');
var config = grip.parseGripUri('http://api.fanout.io/realm/<myrealm>' +
        '?iss=<myrealm>&key=base64:<myrealmkey>');
```

License
-------

(C) 2015 Fanout, Inc.  
Licensed under the MIT License, see file COPYING for details.
