// response-server.js
// (C) 2013 Fan Out Networks, Inc.
// File author: Katsuyuki Ohmuro <harmony7@pex2.jp>
// Licensed under the MIT License, see file COPYING for details.

// This sample uses GRIP in two ways -- one to hold a connection open
// and the other to publish data to a channel.  The two can be used to
// demonstrate a basic use of GRIP in http-response mode.

// Requires an HTTP reverse proxy server that is compatible with the
// GRIP protocol, such as pushpin.

// To try this, you should set up your proxy server so that it forwards
// incoming requests to the binding defined by bindAddr and bindPort
// below.  Also, set up your proxy server so that it listens for GRIP
// instructions, and set the value of the endpoint variable below to point
// to this endpoint.  Also, this discussion assumes that the proxy server
// is set up to listen for incoming requests at http://localhost:7999 (the
// default for pushpin).

// First, start response-server.js in node, and then point a web browser at
// or curl http://localhost:7999/.  This will cause response-server.js to
// behave in the first mode, where it uses createHoldResponse to instruct the
// proxy to hold the connection open.  The request will appear to hang.

// Next, in a new browser window or a new terminal window, this time open
// http://localhost:7999/abcd.  This will cause response-server.js to act in
// the second mode, where it uses publishHttpResponse to instruct the proxy
// to send a value as the http response of the connection being held open by
// the previous step.  The code uses the path ("abcd" in this case) as the
// value to send.

// Switch back to the first browser window or terminal window, and you should
// now see that the string "abcd" has been sent as the HTTP response for that
// request.

var http = require('http');
var grip = require('grip');
var url = require('url');

// Bind address for this server to listen at.
// The HTTP reverse proxy should front this binding.
var bindAddr = '127.0.0.1';
var bindPort = 1337;

// GRIP endpoint of the HTTP reverse proxy.
var endpoint = "http://127.0.0.1:5561";
var pub = new grip.GripPubControl(endpoint);

http.createServer(function (req, res) {
    var reqUrl = url.parse(req.url);
    if(reqUrl.pathname == '/') {
        // If our request is for the '/' path, then use GRIP to hold the connection open.
        var holdResponse = grip.createHoldResponse("test");
        res.writeHead(200, {'Content-Type': 'application/grip-instruct'});
        res.end(holdResponse);
    } else {
        // If our request is for anything but the '/' path, then
        // use path name (remove the leading slash) as our test message.
        // publish it down the test channel.
        // If any connections are held open by the createHoldResponse call above,
        // this will complete those connections.
        var testValue = reqUrl.pathname.replace(/^\//, '');
        pub.publishHttpResponse("test", testValue, function(success, message) {
            var r = [];
            r.push("Pushed test response: " + testValue);
            if(success) {
                r.push("Success!");
            } else {
                r.push("Failed!");
                r.push(util.inspect(message));
            }
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(r.join("\n"));
        });
    }
}).listen(bindPort, bindAddr);
console.log('Server running at http://' + bindAddr + ':' + bindPort + '/');