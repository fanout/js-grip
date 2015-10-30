var http = require('http');
var pubcontrol = require('pubcontrol');
var grip = require('grip');

http.createServer(function (req, res) {
    // Validate the Grip-Sig header:
    if (!grip.validateSig(req.headers['grip-sig'], 'changeme')) {
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
