var assert = require('assert');
var util = require('util');
var jwt = require('jwt-simple');
var grip = require('../lib/grip');
var websocketevent = require('../lib/websocketevent');
var channel = require('../lib/channel');
var response = require('../lib/response');

(function validateSig() {
    var token = jwt.encode(claim = {'claim': 'hello',
            'exp': new Date().getTime() / 1000 + 3600}, 'key==');
    assert(grip.validateSig(token, 'key=='));
    token = jwt.encode(claim = {'claim': 'hello',
            'exp': new Date().getTime() / 1000 - 3600}, 'key==');
    assert(!grip.validateSig(token, 'key=='));
    token = jwt.encode(claim = {'claim': 'hello',
            'exp': new Date().getTime() / 1000 + 3600}, 'key==');
    assert(!grip.validateSig(token, 'key==='));
})();

(function testEncodeWebSocketEvents() {
    var events = grip.decodeWebSocketEvents('OPEN\r\nTEXT 5\r\nHello' + 
        '\r\nTEXT 0\r\n\r\nCLOSE\r\nTEXT\r\nCLOSE\r\n');
    assert.equal(events.length, 6);
    assert.equal(events[0].type, 'OPEN');
    assert.equal(events[0].content, null);
    assert.equal(events[1].type, 'TEXT');
    assert.equal(events[1].content, 'Hello');
    assert.equal(events[2].type, 'TEXT');
    assert.equal(events[2].content, '');
    assert.equal(events[3].type, 'CLOSE');
    assert.equal(events[3].content, null);
    assert.equal(events[4].type, 'TEXT');
    assert.equal(events[4].content, null);
    assert.equal(events[5].type, 'CLOSE');
    assert.equal(events[5].content, null);
    events = grip.decodeWebSocketEvents('OPEN\r\n');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'OPEN');
    assert.equal(events[0].content, null);
    events = grip.decodeWebSocketEvents('TEXT 5\r\nHello\r\n');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'TEXT');
    assert.equal(events[0].content, 'Hello');
    assert.throws(
        function() {
            grip.decodeWebSocketEvents('TEXT 5');
        },
        Error
    );
    assert.throws(
        function() {
            grip.decodeWebSocketEvents('OPEN\r\nTEXT');
        },
        Error
    );
})();

(function testDecodeWebSocketEvents() {
    var events = grip.encodeWebSocketEvents([
        new grip.WebSocketEvent('TEXT', 'Hello'),
        new grip.WebSocketEvent('TEXT', ''),
        new grip.WebSocketEvent('TEXT', null)]);
    assert.equal(events, 'TEXT 5\r\nHello\r\nTEXT 0\r\n\r\nTEXT\r\n');
    events = grip.encodeWebSocketEvents([new grip.WebSocketEvent('OPEN')]);
    assert.equal(events, 'OPEN\r\n');
})();

(function testwebSocketControlMessage() {
    var message = grip.webSocketControlMessage('type');
    assert.equal(JSON.stringify({'type': 'type'}), message);
    message = grip.webSocketControlMessage('type', {'arg': 'val'});
    assert.equal(JSON.stringify({'arg': 'val', 'type': 'type'}), message);
})();

(function testwebSocketControlMessage() {
    assert.throws(
        function() {
            assert.raises(grip.createGripChannelHeader([]))
        },
        Error
    );
    header = grip.createGripChannelHeader('channel');
    assert.equal(header, 'channel');
    header = grip.createGripChannelHeader(new channel.Channel('channel'));
    assert.equal(header, 'channel');
    header = grip.createGripChannelHeader(new channel.Channel('channel',
        'prev-id'));
    assert.equal(header, 'channel; prev-id=prev-id');
    header = grip.createGripChannelHeader([new channel.Channel('channel1',
        'prev-id1'), new channel.Channel('channel2', 'prev-id2')]);
    assert.equal(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
})();
