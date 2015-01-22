var ws = require("nodejs-websocket")
var pubcontrol = require('pubcontrol');
var grip = require('grip');

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
