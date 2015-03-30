var assert = require('assert');
var util = require('util');
var jwt = require('jwt-simple');
var grip = require('../lib/grip');

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

(function testCreateGripChannelHeader() {
    assert.throws(
        function() {
            assert.raises(grip.createGripChannelHeader([]))
        },
        Error
    );
    header = grip.createGripChannelHeader('channel');
    assert.equal(header, 'channel');
    header = grip.createGripChannelHeader(new grip.Channel('channel'));
    assert.equal(header, 'channel');
    header = grip.createGripChannelHeader(new grip.Channel('channel',
        'prev-id'));
    assert.equal(header, 'channel; prev-id=prev-id');
    header = grip.createGripChannelHeader([new grip.Channel('channel1',
        'prev-id1'), new grip.Channel('channel2', 'prev-id2')]);
    assert.equal(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
})();

(function testCreateHold() {
    var hold = grip.createHold('mode', 'chan', 'response', 'timeout');
    assert.equal(hold, JSON.stringify({'hold': { 'mode': 'mode',
            'channels': [(new grip.Channel('chan')).export()], 
             'timeout': 'timeout'}, 'response':
            (new grip.Response(null, null, null, 'response')).export()
            }));
    hold = grip.createHold('mode', 'chan', 'response');
    assert.equal(hold, JSON.stringify({'hold': { 'mode': 'mode',
            'channels': [(new grip.Channel('chan')).export()], 
            }, 'response':
            (new grip.Response(null, null, null, 'response')).export()
            }));
    hold = grip.createHold('mode', 'chan', new grip.Response(
            'code', 'reason', 'headers', 'body'));
    assert.equal(hold, JSON.stringify({'hold': { 'mode': 'mode',
            'channels': [(new grip.Channel('chan')).export()], 
            }, 'response':
            (new grip.Response('code', 'reason', 'headers', 'body')).
            export()}));
})();

(function testCreateHoldResponse() {
    var hold = grip.createHoldResponse('chan', 'response', 'timeout');
    assert.equal(hold, JSON.stringify({'hold': { 'mode': 'response',
            'channels': [(new grip.Channel('chan')).export()], 
             'timeout': 'timeout'}, 'response':
            (new grip.Response(null, null, null, 'response')).export()
            }));
})();

(function testCreateHoldStream() {
    var hold = grip.createHoldStream('chan', 'response');
    assert.equal(hold, JSON.stringify({'hold': { 'mode': 'stream',
            'channels': [(new grip.Channel('chan')).export()]}, 'response':
            (new grip.Response(null, null, null, 'response')).export()
            }));
})();

(function testParseGripUri() {
    var uri = 'http://api.fanout.io/realm/realm?iss=realm' +
        '&key=base64:geag121321='
    var config = grip.parseGripUri(uri)
    assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
    assert.equal(config['control_iss'], 'realm')
    assert.equal(config['key'], new Buffer('geag121321=', 'base64').toString())
    uri = 'https://api.fanout.io/realm/realm?iss=realm' +
        '&key=base64:geag121321='
    config = grip.parseGripUri(uri)
    assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
    config = grip.parseGripUri('http://api.fanout.io/realm/realm')
    assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
    assert.equal('control_iss' in config, false)
    assert.equal('key' in config, false)
    uri = 'http://api.fanout.io/realm/realm?iss=realm' +
        '&key=base64:geag121321=&param1=value1&param2=value2'
    config = grip.parseGripUri(uri)
    assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm?' +
        'param1=value1&param2=value2')
    assert.equal(config['control_iss'], 'realm')
    assert.equal(config['key'], new Buffer('geag121321=', 'base64').toString())
    config = grip.parseGripUri('http://api.fanout.io:8080/realm/realm/')
    assert.equal(config['control_uri'], 'http://api.fanout.io:8080/realm/realm')
    uri = 'http://api.fanout.io/realm/realm?iss=realm' +
        '&key=geag121321='
    config = grip.parseGripUri(uri)
    assert.equal(config['key'], 'geag121321=')
})();

(function testParseChannels() {
    var channels = grip.parseChannels('chan');
    assert.equal(channels[0].name, 'chan');
    channels = grip.parseChannels('chan');
    assert.equal(channels[0].name, 'chan');
    channels = grip.parseChannels(new grip.Channel('chan', 'prev-id'));
    assert.equal(channels[0].name, 'chan');
    assert.equal(channels[0].prevId, 'prev-id');
    channels = grip.parseChannels([new grip.Channel('chan', 'prev-id')]);
    assert.equal(channels[0].name, 'chan');
    assert.equal(channels[0].prevId, 'prev-id');
})();

(function testGetHoldChannels() {
    var holdChannels = grip.getHoldChannels([
            new grip.Channel('chan', 'prev-id'),
            new grip.Channel('chan2', 'prev-id2')]);
    assert.equal(JSON.stringify(holdChannels), JSON.stringify(
            [(new grip.Channel('chan', 'prev-id')).export(),
            (new grip.Channel('chan2', 'prev-id2')).export()]));
    var holdChannels = grip.getHoldChannels(['channel']);
    assert.equal(JSON.stringify(holdChannels), JSON.stringify(
            [(new grip.Channel('channel')).export()]));
})();
