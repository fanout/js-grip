import assert from "assert";
import jwt from "jwt-simple";

import GripControl from '../esm/GripControl.mjs';
import Channel from '../esm/data/Channel.mjs';
import Response from '../esm/data/Response.mjs';
import WebSocketEvent from '../esm/data/websocket/WebSocketEvent.mjs';
import { buildWebSocketControlMessage } from '../esm/data/websocket/WebSocketContext.mjs';

(function validateSig() {
    let token = jwt.encode({
        'claim': 'hello',
        'exp': new Date().getTime() / 1000 + 3600
    }, 'key==');
    assert(GripControl.validateSig(token, 'key=='));
    token = jwt.encode({
        'claim': 'hello',
        'exp': new Date().getTime() / 1000 - 3600
    }, 'key==');
    assert(!GripControl.validateSig(token, 'key=='));
    token = jwt.encode({
        'claim': 'hello',
        'exp': new Date().getTime() / 1000 + 3600
    }, 'key==');
    assert(!GripControl.validateSig(token, 'key==='));
})();

(function testEncodeWebSocketEvents() {
    let events = GripControl.decodeWebSocketEvents('OPEN\r\nTEXT 5\r\nHello' +
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

    events = GripControl.decodeWebSocketEvents('OPEN\r\n');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'OPEN');
    assert.equal(events[0].content, null);

    events = GripControl.decodeWebSocketEvents('TEXT 5\r\nHello\r\n');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'TEXT');
    assert.equal(events[0].content, 'Hello');
    assert.throws(
        function () {
            GripControl.decodeWebSocketEvents('TEXT 5');
        },
        Error
    );
    assert.throws(
        function () {
            GripControl.decodeWebSocketEvents('OPEN\r\nTEXT');
        },
        Error
    );
})();

(function testDecodeWebSocketEvents() {
    let events = GripControl.encodeWebSocketEvents([
        new WebSocketEvent('TEXT', 'Hello'),
        new WebSocketEvent('TEXT', ''),
        new WebSocketEvent('TEXT', null)]);
    assert.equal(events, 'TEXT 5\r\nHello\r\nTEXT 0\r\n\r\nTEXT\r\n');
    events = GripControl.encodeWebSocketEvents([new WebSocketEvent('OPEN')]);
    assert.equal(events, 'OPEN\r\n');
})();

(function testwebSocketControlMessage() {
    let message = buildWebSocketControlMessage('type');
    assert.equal(JSON.stringify({'type': 'type'}), message);
    message = buildWebSocketControlMessage('type', {'arg': 'val'});
    assert.equal(JSON.stringify({'arg': 'val', 'type': 'type'}), message);
})();

(function testCreateGripChannelHeader() {
    assert.throws(
        function () {
            assert.raises(GripControl.createGripChannelHeader([]))
        },
        Error
    );

    let header = GripControl.createGripChannelHeader('channel');
    assert.equal(header, 'channel');

    header = GripControl.createGripChannelHeader(new Channel('channel'));
    assert.equal(header, 'channel');

    header = GripControl.createGripChannelHeader(new Channel('channel',
        'prev-id'));
    assert.equal(header, 'channel; prev-id=prev-id');

    header = GripControl.createGripChannelHeader([new Channel('channel1',
        'prev-id1'), new Channel('channel2', 'prev-id2')]);
    assert.equal(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
})();

(function testCreateHold() {
    let hold = GripControl.createHold('mode', 'chan', 'response', 'timeout');
    assert.equal(hold, JSON.stringify({
        'hold': {
            'mode': 'mode',
            'channels': [(new Channel('chan')).export()],
            'timeout': 'timeout'
        }, 'response':
            (new Response(null, null, null, 'response')).export()
    }));

    hold = GripControl.createHold('mode', 'chan', 'response');
    assert.equal(hold, JSON.stringify({
        'hold': {
            'mode': 'mode',
            'channels': [(new Channel('chan')).export()],
        }, 'response':
            (new Response(null, null, null, 'response')).export()
    }));

    hold = GripControl.createHold('mode', 'chan', new Response(
        'code', 'reason', 'headers', 'body'));
    assert.equal(hold, JSON.stringify({
        'hold': {
            'mode': 'mode',
            'channels': [(new Channel('chan')).export()],
        }, 'response':
            (new Response('code', 'reason', 'headers', 'body')).export()
    }));
})();

(function testCreateHoldResponse() {
    const hold = GripControl.createHoldResponse('chan', 'response', 'timeout');
    assert.equal(hold, JSON.stringify({
        'hold': {
            'mode': 'response',
            'channels': [(new Channel('chan')).export()],
            'timeout': 'timeout'
        }, 'response':
            (new Response(null, null, null, 'response')).export()
    }));
})();

(function testCreateHoldStream() {
    const hold = GripControl.createHoldStream('chan', 'response');
    assert.equal(hold, JSON.stringify({
        'hold': {
            'mode': 'stream',
            'channels': [(new Channel('chan')).export()]
        }, 'response':
            (new Response(null, null, null, 'response')).export()
    }));
})();

(function testParseGripUri() {
    let uri = 'http://api.fanout.io/realm/realm?iss=realm' +
        '&key=base64:geag121321='
    let config = GripControl.parseGripUri(uri)
    assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
    assert.equal(config['control_iss'], 'realm')
    assert.equal(config['key'], Buffer.from('geag121321=', 'base64').toString())

    uri = 'https://api.fanout.io/realm/realm?iss=realm' +
        '&key=base64:geag121321='
    config = GripControl.parseGripUri(uri)
    assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')

    uri = 'https://api.fanout.io/realm/realm?key=base64:geag%2B21321='
    config = GripControl.parseGripUri(uri)
    assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
    assert.equal(config['key'], Buffer.from('geag+21321=', 'base64').toString())

    uri = 'https://api.fanout.io/realm/realm?key=base64:geag+21321='
    config = GripControl.parseGripUri(uri)
    assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
    assert.equal(config['key'], Buffer.from('geag+21321=', 'base64').toString())

    config = GripControl.parseGripUri('http://api.fanout.io/realm/realm')
    assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
    assert.equal('control_iss' in config, false)
    assert.equal('key' in config, false)

    uri = 'http://api.fanout.io/realm/realm?iss=realm' +
        '&key=base64:geag121321=&param1=value1&param2=value2'
    config = GripControl.parseGripUri(uri)
    assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm?' +
        'param1=value1&param2=value2')
    assert.equal(config['control_iss'], 'realm')
    assert.equal(config['key'], Buffer.from('geag121321=', 'base64').toString())

    config = GripControl.parseGripUri('http://api.fanout.io:8080/realm/realm/')
    assert.equal(config['control_uri'], 'http://api.fanout.io:8080/realm/realm')

    uri = 'http://api.fanout.io/realm/realm?iss=realm' +
        '&key=geag121321='
    config = GripControl.parseGripUri(uri)
    assert.equal(config['key'], 'geag121321=')
})();

(function testParseChannels() {
    let channels = GripControl.parseChannels('chan');
    assert.equal(channels[0].name, 'chan');

    channels = GripControl.parseChannels('chan');
    assert.equal(channels[0].name, 'chan');

    channels = GripControl.parseChannels(new Channel('chan', 'prev-id'));
    assert.equal(channels[0].name, 'chan');
    assert.equal(channels[0].prevId, 'prev-id');

    channels = GripControl.parseChannels([new Channel('chan', 'prev-id')]);
    assert.equal(channels[0].name, 'chan');
    assert.equal(channels[0].prevId, 'prev-id');
})();

(function testGetHoldChannels() {
    let holdChannels = GripControl.getHoldChannels([
        new Channel('chan', 'prev-id'),
        new Channel('chan2', 'prev-id2')]);
    assert.equal(JSON.stringify(holdChannels), JSON.stringify(
        [(new Channel('chan', 'prev-id')).export(),
            (new Channel('chan2', 'prev-id2')).export()]));

    holdChannels = GripControl.getHoldChannels(['channel']);
    assert.equal(JSON.stringify(holdChannels), JSON.stringify(
        [(new Channel('channel')).export()]));
})();