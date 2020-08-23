var ws = require("nodejs-websocket")
var {
    createWebSocketControlMessage,
    Publisher,
    WebSocketMessageFormat,
} = require('@fanout/grip');

ws.createServer(function (conn) {
     // Subscribe the WebSocket to a channel:
    conn.sendText('c:' + createWebSocketControlMessage(
            'subscribe', {'channel': '<channel>'}));

    // Wait and then publish a message to the subscribed channel:
    setTimeout(function() {
        var grippub = new Publisher({
                'control_uri': '<myendpoint>'});
        grippub.publish('test_channel', new grip.Item(
                new WebSocketMessageFormat(
                'Test WebSocket Publish!!')));
    }, 5000);
}).listen(80, '0.0.0.0');

console.log('Server running...');
