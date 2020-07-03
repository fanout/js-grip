import assert from "assert";
import jwt from "jwt-simple";

import * as gripUtilities from '../src/gripUtilities';
import Channel from '../src/data/Channel';
import Response from '../src/data/Response';
import WebSocketEvent from '../src/data/websocket/WebSocketEvent';

describe('gripUtilities', function () {
    describe('#validateSig', function () {
        it('check that a signature can be validated', function() {
            const token = jwt.encode({
                'claim': 'hello',
                'exp': new Date().getTime() / 1000 + 3600
            }, 'key==');
            assert(gripUtilities.validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if it's expired", function() {
            const token = jwt.encode({
                'claim': 'hello',
                'exp': new Date().getTime() / 1000 - 3600
            }, 'key==');
            assert(!gripUtilities.validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if the key doesn't match", function() {
            const token = jwt.encode({
                'claim': 'hello',
                'exp': new Date().getTime() / 1000 + 3600
            }, 'key==');
            assert(!gripUtilities.validateSig(token, 'key==='));
        });
    });
    describe('#encodeWebSocketEvents', function () {
        it('test case', function() {
            const events = gripUtilities.encodeWebSocketEvents([
                new WebSocketEvent('TEXT', 'Hello'),
                new WebSocketEvent('TEXT', ''),
                new WebSocketEvent('TEXT', null),
            ]);
            assert.equal(events, 'TEXT 5\r\nHello\r\nTEXT 0\r\n\r\nTEXT\r\n');
        });
        it('test case', function() {
            const events = gripUtilities.encodeWebSocketEvents([
                new WebSocketEvent('OPEN'),
            ]);
            assert.equal(events, 'OPEN\r\n');
        });
    });
    describe('#decodeWebSocketEvents', function () {
        it('test case', function() {
            const events = gripUtilities.decodeWebSocketEvents('OPEN\r\nTEXT 5\r\nHello' +
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
        });
        it('test case', function() {
            const events = gripUtilities.decodeWebSocketEvents('OPEN\r\n');
            assert.equal(events.length, 1);
            assert.equal(events[0].type, 'OPEN');
            assert.equal(events[0].content, null);
        });
        it('test case', function() {
            const events = gripUtilities.decodeWebSocketEvents('TEXT 5\r\nHello\r\n');
            assert.equal(events.length, 1);
            assert.equal(events[0].type, 'TEXT');
            assert.equal(events[0].content, 'Hello');
        });
        it('test case that should throw', function() {
            assert.throws(
                function () {
                    gripUtilities.decodeWebSocketEvents('TEXT 5');
                },
                Error
            );
        });
        it('test case that should throw', function() {
            assert.throws(
                function () {
                    gripUtilities.decodeWebSocketEvents('OPEN\r\nTEXT');
                },
                Error
            );
        });
    });
    describe('#buildWebSocketControlMessage', function () {
        it('test case', function() {
            const message = gripUtilities.buildWebSocketControlMessage('type');
            assert.equal(JSON.stringify({'type': 'type'}), message);
        });
        it('test case', function() {
            const message = gripUtilities.buildWebSocketControlMessage('type', {'arg': 'val'});
            assert.equal(JSON.stringify({'arg': 'val', 'type': 'type'}), message);
        });
    });
    describe('#createGripChannelHeader', function () {
        it('test case', function() {
            const header = gripUtilities.createGripChannelHeader('channel');
            assert.equal(header, 'channel');
        });
        it('test case', function() {
            const header = gripUtilities.createGripChannelHeader(new Channel('channel'));
            assert.equal(header, 'channel');
        });
        it('test case', function() {
            const header = gripUtilities.createGripChannelHeader(new Channel('channel',
                'prev-id'));
            assert.equal(header, 'channel; prev-id=prev-id');
        });
        it('test case', function() {
            const header = gripUtilities.createGripChannelHeader([new Channel('channel1',
                'prev-id1'), new Channel('channel2', 'prev-id2')]);
            assert.equal(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
        });
    });
    describe('#createHold', function () {
        it('test case', function() {
            const hold = gripUtilities.createHold('mode', 'chan', 'response', 999);
            assert.equal(hold, JSON.stringify({
                'hold': {
                    'mode': 'mode',
                    'channels': [(new Channel('chan')).export()],
                    'timeout': 999
                }, 'response':
                    (new Response(null, null, null, 'response')).export()
            }));
        });
        it('test case', function() {
            const hold = gripUtilities.createHold('mode', 'chan', 'response');
            assert.equal(hold, JSON.stringify({
                'hold': {
                    'mode': 'mode',
                    'channels': [(new Channel('chan')).export()],
                }, 'response':
                    (new Response(null, null, null, 'response')).export()
            }));
        });
        it('test case', function() {
            const hold = gripUtilities.createHold('mode', 'chan', new Response(
                'code', 'reason', 'headers', 'body'));
            assert.equal(hold, JSON.stringify({
                'hold': {
                    'mode': 'mode',
                    'channels': [(new Channel('chan')).export()],
                }, 'response':
                    (new Response('code', 'reason', 'headers', 'body')).export()
            }));
        });
    });
    describe('#createHoldResponse', function () {
        it('test case', function() {
            const hold = gripUtilities.createHoldResponse('chan', 'response', 999);
            assert.equal(hold, JSON.stringify({
                'hold': {
                    'mode': 'response',
                    'channels': [(new Channel('chan')).export()],
                    'timeout': 999
                }, 'response':
                    (new Response(null, null, null, 'response')).export()
            }));
        });
    });
    describe('#createHoldStream', function () {
        it('test case', function() {
            const hold = gripUtilities.createHoldStream('chan', 'response');
            assert.equal(hold, JSON.stringify({
                'hold': {
                    'mode': 'stream',
                    'channels': [(new Channel('chan')).export()]
                }, 'response':
                    (new Response(null, null, null, 'response')).export()
            }));
        });
    });
    describe('#parseGripUri', function () {
        it('test case', function() {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag121321='
            const config = gripUtilities.parseGripUri(uri)
            assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
            assert.equal(config['control_iss'], 'realm')
            assert.equal(config['key'], Buffer.from('geag121321=', 'base64').toString())
        });
        it('test case', function() {
            const uri = 'https://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag121321='
            const config = gripUtilities.parseGripUri(uri)
            assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
        });
        it('test case', function() {
            const uri = 'https://api.fanout.io/realm/realm?key=base64:geag%2B21321='
            const config = gripUtilities.parseGripUri(uri)
            assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
            assert.equal(config['key'], Buffer.from('geag+21321=', 'base64').toString())
        });
        it('test case', function() {
            const uri = 'https://api.fanout.io/realm/realm?key=base64:geag+21321='
            const config = gripUtilities.parseGripUri(uri)
            assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
            assert.equal(config['key'], Buffer.from('geag+21321=', 'base64').toString())
        });
        it('test case', function() {
            const config = gripUtilities.parseGripUri('http://api.fanout.io/realm/realm')
            assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
            assert.equal('control_iss' in config, false)
            assert.equal('key' in config, false)
        });
        it('test case', function() {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag121321=&param1=value1&param2=value2'
            const config = gripUtilities.parseGripUri(uri)
            assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm?' +
                'param1=value1&param2=value2')
            assert.equal(config['control_iss'], 'realm')
            assert.equal(config['key'], Buffer.from('geag121321=', 'base64').toString())
        });
        it('test case', function() {
            const config = gripUtilities.parseGripUri('http://api.fanout.io:8080/realm/realm/')
            assert.equal(config['control_uri'], 'http://api.fanout.io:8080/realm/realm')
        });
        it('test case', function() {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=geag121321='
            const config = gripUtilities.parseGripUri(uri)
            assert.equal(config['key'], 'geag121321=')
        });
    });
    describe('#parseChannels', function () {
        it('test case', function() {
            const channels = gripUtilities.parseChannels('chan');
            assert.equal(channels[0].name, 'chan');
        });
        it('test case', function() {
            const channels = gripUtilities.parseChannels(['chan']);
            assert.equal(channels[0].name, 'chan');
        });
        it('test case', function() {
            const channels = gripUtilities.parseChannels(new Channel('chan', 'prev-id'));
            assert.equal(channels[0].name, 'chan');
            assert.equal(channels[0].prevId, 'prev-id');
        });
        it('test case', function() {
            const channels = gripUtilities.parseChannels([new Channel('chan', 'prev-id')]);
            assert.equal(channels[0].name, 'chan');
            assert.equal(channels[0].prevId, 'prev-id');
        });
    });
    describe('#getHoldChannels', function () {
        it('test case', function() {
            const holdChannels = gripUtilities.getHoldChannels([
                new Channel('chan', 'prev-id'),
                new Channel('chan2', 'prev-id2'),
            ]);
            assert.equal(JSON.stringify(holdChannels), JSON.stringify(
                [(new Channel('chan', 'prev-id')).export(),
                    (new Channel('chan2', 'prev-id2')).export()]));
        });
        it('test case', function() {
            const holdChannels = gripUtilities.getHoldChannels(['channel']);
            assert.equal(JSON.stringify(holdChannels), JSON.stringify(
                [(new Channel('channel')).export()]));
        });
    });
});
