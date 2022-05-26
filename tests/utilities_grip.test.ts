import * as assert from "assert";

import { Channel } from '../src';
import {
    parseChannels,
    parseGripUri,
    createGripChannelHeader,
} from "../src/utilities/grip";

describe('utilities/grip', function () {
    describe('#parseChannels', function () {
        it('test case', function() {
            const channels = parseChannels('chan');
            assert.equal(channels[0].name, 'chan');
        });
        it('test case', function() {
            const channels = parseChannels(['chan']);
            assert.equal(channels[0].name, 'chan');
        });
        it('test case', function() {
            const channels = parseChannels(new Channel('chan', 'prev-id'));
            assert.equal(channels[0].name, 'chan');
            assert.equal(channels[0].prevId, 'prev-id');
        });
        it('test case', function() {
            const channels = parseChannels([new Channel('chan', 'prev-id')]);
            assert.equal(channels[0].name, 'chan');
            assert.equal(channels[0].prevId, 'prev-id');
        });
    });
    describe('#parseGripUri', function () {
        it('test case', function() {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag121321='
            const config = parseGripUri(uri)
            assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
            assert.equal(config['control_iss'], 'realm')
            assert.equal(config['key'], Buffer.from('geag121321=', 'base64').toString())
        });
        it('test case', function() {
            const uri = 'https://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag121321='
            const config = parseGripUri(uri)
            assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
        });
        it('test case', function() {
            const uri = 'https://api.fanout.io/realm/realm?key=base64:geag%2B21321='
            const config = parseGripUri(uri)
            assert.equal(config['control_uri'], 'https://api.fanout.io/realm/realm')
            assert.equal(config['key'], Buffer.from('geag+21321=', 'base64').toString())
        });
        it('test case', function() {
            const config = parseGripUri('http://api.fanout.io/realm/realm')
            assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm')
            assert.equal('control_iss' in config, false)
            assert.equal('key' in config, false)
        });
        it('test case', function() {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag121321=&param1=value1&param2=value2'
            const config = parseGripUri(uri)
            assert.equal(config['control_uri'], 'http://api.fanout.io/realm/realm?' +
                'param1=value1&param2=value2')
            assert.equal(config['control_iss'], 'realm')
            assert.equal(config['key'], Buffer.from('geag121321=', 'base64').toString())
        });
        it('test case', function() {
            const config = parseGripUri('http://api.fanout.io:8080/realm/realm/')
            assert.equal(config['control_uri'], 'http://api.fanout.io:8080/realm/realm')
        });
        it('test case', function() {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=geag121321='
            const config = parseGripUri(uri)
            assert.equal(config['key'], 'geag121321=')
        });
    });
    describe('#createGripChannelHeader', function () {
        it('test case', function() {
            const header = createGripChannelHeader('channel');
            assert.equal(header, 'channel');
        });
        it('test case', function() {
            const header = createGripChannelHeader(new Channel('channel'));
            assert.equal(header, 'channel');
        });
        it('test case', function() {
            const header = createGripChannelHeader(new Channel('channel',
                'prev-id'));
            assert.equal(header, 'channel; prev-id=prev-id');
        });
        it('test case', function() {
            const header = createGripChannelHeader([new Channel('channel1',
                'prev-id1'), new Channel('channel2', 'prev-id2')]);
            assert.equal(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
        });
    });
});
