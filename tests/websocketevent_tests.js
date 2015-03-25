var assert = require('assert');
var websocketevent = require('../lib/websocketevent');

(function testInitialize() {
    var we = new websocketevent.WebSocketEvent('type');
    assert.equal(we.type, 'type');
    assert.equal(we.content, null);
    we = new websocketevent.WebSocketEvent('type', 'content');
    assert.equal(we.type, 'type');
    assert.equal(we.content, 'content');
})();

(function testGetType() {
    var we = new websocketevent.WebSocketEvent('type');
    assert.equal(we.getType(), 'type');
})();

(function testGetContent() {
    var we = new websocketevent.WebSocketEvent('type', 'content');
    assert.equal(we.getContent(), 'content');
})();

