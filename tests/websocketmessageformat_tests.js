var assert = require('assert');
var grip = require('../lib/grip');
var websocketmessageformat = require('../lib/websocketmessageformat');

(function testInitialize() {
    var ws = new grip.WebSocketMessageFormat('content');
    assert.equal(ws.content, 'content');
})();

(function testName() {
    var ws = new grip.WebSocketMessageFormat('content');
    assert.equal(ws.name(), 'ws-message');
})();

(function testExport() {
    var ws = new grip.WebSocketMessageFormat('message');
    assert.equal(ws.export()['content'], 'message');
    var ws = new grip.WebSocketMessageFormat(new
            Buffer('message'));
    assert.equal(ws.export()['content-bin'], new Buffer('message').
            toString('base64'));
    ws = new grip.WebSocketMessageFormat(null, true, 1009);
    assert.equal(ws.export()['action'], 'close');
    assert.equal(ws.export()['code'], 1009);
})();

