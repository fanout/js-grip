var assert = require('assert');
var websocketmessageformat = require('../lib/websocketmessageformat');

(function testInitialize() {
    var ws = new websocketmessageformat.WebSocketMessageFormat('content');
    assert.equal(ws.content, 'content');
})();

(function testName() {
    var ws = new websocketmessageformat.WebSocketMessageFormat('content');
    assert.equal(ws.name(), 'ws-message');
})();

(function testExport() {
    var ws = new websocketmessageformat.WebSocketMessageFormat('message');
    assert.equal(ws.export()['content'], 'message');
    var ws = new websocketmessageformat.WebSocketMessageFormat(new
            Buffer('message'));
    assert.equal(ws.export()['content-bin'], new Buffer('message').
            toString('base64'));
})();

