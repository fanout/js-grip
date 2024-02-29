import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    Channel,
    parseChannels,
    parseGripUri,
    createGripChannelHeader,
} from '../../../src/index.js';

describe('utilities/grip', () => {
    describe('#parseChannels', () => {
        it('test case', () => {
            const channels = parseChannels('chan');
            assert.strictEqual(channels[0].name, 'chan');
        });
        it('test case', () => {
            const channels = parseChannels(['chan']);
            assert.strictEqual(channels[0].name, 'chan');
        });
        it('test case', () => {
            const channels = parseChannels(new Channel('chan', 'prev-id'));
            assert.strictEqual(channels[0].name, 'chan');
            assert.strictEqual(channels[0].prevId, 'prev-id');
        });
        it('test case', () => {
            const channels = parseChannels([new Channel('chan', 'prev-id')]);
            assert.strictEqual(channels[0].name, 'chan');
            assert.strictEqual(channels[0].prevId, 'prev-id');
        });
    });
    describe('#parseGripUri', () => {
        it('test case', () => {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:aGVsbG8='
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm');
            assert.strictEqual(config['control_iss'], 'realm');
            assert.strictEqual(config['key'], 'base64:aGVsbG8=');
        });
        it('test case', () => {
            const uri = 'https://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag12132w==';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'https://api.fanout.io/realm/realm');
        });
        it('test case', () => {
            const uri = 'https://api.fanout.io/realm/realm?key=base64:geag%2B2132w==';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'https://api.fanout.io/realm/realm');
            assert.deepStrictEqual(config['key'], 'base64:geag+2132w==');
        });
        it('test case', () => {
            const config = parseGripUri('http://api.fanout.io/realm/realm');
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm');
            assert.strictEqual('control_iss' in config, false);
            assert.strictEqual('key' in config, false);
        });
        it('test case', () => {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag12132w==&param1=value1&param2=value2';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm?' +
                'param1=value1&param2=value2');
            assert.strictEqual(config['control_iss'], 'realm');
            assert.deepStrictEqual(config['key'], 'base64:geag12132w==');
        });
        it('test case', () => {
            const config = parseGripUri('http://api.fanout.io:8080/realm/realm/');
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io:8080/realm/realm');
        });
        it('test case', () => {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=geag12132w==';
            const config = parseGripUri(uri);
            assert.deepStrictEqual(config['key'], 'geag12132w==');
        });
        it('test case', () => {
            const uri = 'https://api.fastly.com/service/service?' +
              'key=apikey&verify-iss=fastly:service&verify-key=base64:geag12132w==';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'https://api.fastly.com/service/service');
            assert.strictEqual(config['control_iss'], undefined);
            assert.strictEqual(config['key'], 'apikey');
            assert.strictEqual(config['verify_iss'], 'fastly:service');
            assert.deepStrictEqual(config['verify_key'], 'base64:geag12132w==');
        });
        it('test case', () => {
            const uri = 'https://api.fastly.com/service/service?' +
              'key=apikey&verify-iss=fastly:service';
            const config = parseGripUri(uri, { 'verify-key': 'base64:geag12132w==' });
            assert.strictEqual(config['control_uri'], 'https://api.fastly.com/service/service');
            assert.strictEqual(config['control_iss'], undefined);
            assert.strictEqual(config['key'], 'apikey');
            assert.strictEqual(config['verify_iss'], 'fastly:service');
            assert.deepStrictEqual(config['verify_key'], 'base64:geag12132w==');
        });
    });
    describe('#createGripChannelHeader', () => {
        it('test case', () => {
            const header = createGripChannelHeader('channel');
            assert.strictEqual(header, 'channel');
        });
        it('test case', () => {
            const header = createGripChannelHeader(new Channel('channel'));
            assert.strictEqual(header, 'channel');
        });
        it('test case', () => {
            const header = createGripChannelHeader(new Channel('channel',
                'prev-id'));
            assert.strictEqual(header, 'channel; prev-id=prev-id');
        });
        it('test case', () => {
            const header = createGripChannelHeader([new Channel('channel1',
                'prev-id1'), new Channel('channel2', 'prev-id2')]);
            assert.strictEqual(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
        });
    });
});
