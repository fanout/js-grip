nodegrip - GRIP interface library for NodeJS
============================================

Date: April 3rd, 2013
Author: Katsuyuki Ohmuro <harmony7@pex2.jp>

Description
-----------

A GRIP interface library for NodeJS.  For use with HTTP reverse proxy servers
that support the GRIP interface, such as Pushpin.

This library supports the following GRIP instructions:

hold-response
hold-stream
publish-response
publish-stream

Requirements
------------

  pubcontrol

Sample usage
------------

When there is an incoming request to the proxy, you may use a GRIP instruction
to defer the HTTP response and instruct the proxy to instead hold the connection
open.  In this case you may use a future GRIP instruction to send the response.

    var holdResponse = grip.createHoldResponse("test");
    res.writeHead(200, {'Content-Type': 'application/grip-instruct'});
    res.end(holdResponse);

When the response is ready to be sent through the held connection, use the
following GRIP instruction to send it.

    // GRIP endpoint of the HTTP reverse proxy.
    // The following is the default endpoint if using Pushpin.
    var endpoint = "http://127.0.0.1:5561";
    var pub = new grip.GripPubControl(endpoint);
    pub.publishHttpResponse("test", "Hello, World!", function(success, message) {
        console.log(success);
    });

In addition to the "response" GRIP instruction types illustrated by these
examples, this library is also able to work with the "stream" GRIP instruction
types.  To do this, use the grip.createHoldStream method to hold the connection
open, and then repeatedly call pub.publishHttpStream with data chunks.

License
-------

(C) 2013 Fan Out Networks, Inc.
Licensed under the MIT License, see file COPYING for details.
