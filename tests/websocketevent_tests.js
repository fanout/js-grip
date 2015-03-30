var assert = require('assert');
var grip = require('../lib/grip');

(function testInitialize() {
    var we = new grip.WebSocketEvent('type');
    assert.equal(we.type, 'type');
    assert.equal(we.content, null);
    we = new grip.WebSocketEvent('type', 'content');
    assert.equal(we.type, 'type');
    assert.equal(we.content, 'content');
})();

(function testGetType() {
    var we = new grip.WebSocketEvent('type');
    assert.equal(we.getType(), 'type');
})();

(function testGetContent() {
    var we = new grip.WebSocketEvent('type', 'content');
    assert.equal(we.getContent(), 'content');
})();

