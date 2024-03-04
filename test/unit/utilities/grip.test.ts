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
        it('parses single string', () => {
            const channels = parseChannels('chan');
            assert.strictEqual(channels[0].name, 'chan');
        });
        it('parses array of strings', () => {
            const channels = parseChannels(['chan']);
            assert.strictEqual(channels[0].name, 'chan');
        });
        it('accepts Channel object', () => {
            const channels = parseChannels(new Channel('chan', 'prev-id'));
            assert.strictEqual(channels[0].name, 'chan');
            assert.strictEqual(channels[0].prevId, 'prev-id');
        });
        it('accepts array of Channel objects', () => {
            const channels = parseChannels([new Channel('chan', 'prev-id')]);
            assert.strictEqual(channels[0].name, 'chan');
            assert.strictEqual(channels[0].prevId, 'prev-id');
        });
    });
    describe('#parseGripUri', () => {
        it('parses URL with uri, iss, and key', () => {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:aGVsbG8='
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm');
            assert.strictEqual(config['control_iss'], 'realm');
            assert.strictEqual(config['key'], 'base64:aGVsbG8=');
        });
        it('parses URL and decodes percent-encoding', () => {
            const uri = 'https://api.fanout.io/realm/realm?key=base64:geag%2B2132w==';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'https://api.fanout.io/realm/realm');
            assert.strictEqual(config['key'], 'base64:geag+2132w==');
        });
        it('parses URL and resulting object does not include params that were not specified', () => {
            const config = parseGripUri('http://api.fanout.io/realm/realm');
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm');
            assert.ok(!('control_iss' in config));
            assert.ok(!('key' in config));
        });
        it('parses and does not drop additional query params', () => {
            const uri = 'http://api.fanout.io/realm/realm?iss=realm' +
                '&key=base64:geag12132w==&param1=value1&param2=value2';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm?' +
                'param1=value1&param2=value2');
            assert.strictEqual(config['control_iss'], 'realm');
            assert.deepStrictEqual(config['key'], 'base64:geag12132w==');
        });
        it('parses user and pass', () => {
            const config = parseGripUri('http://user:pass@api.fanout.io/realm/realm/');
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io/realm/realm');
            assert.strictEqual(config['user'], 'user');
            assert.strictEqual(config['pass'], 'pass');
        });
        it('parses and keeps the port', () => {
            const config = parseGripUri('http://api.fanout.io:8080/realm/realm/');
            assert.strictEqual(config['control_uri'], 'http://api.fanout.io:8080/realm/realm');
        });
        it('parses URL including verify-iss and verify-key params', () => {
            const uri = 'https://api.fastly.com/service/service?' +
              'key=apikey&verify-iss=fastly:service&verify-key=base64:geag12132w==';
            const config = parseGripUri(uri);
            assert.strictEqual(config['control_uri'], 'https://api.fastly.com/service/service');
            assert.strictEqual(config['control_iss'], undefined);
            assert.strictEqual(config['key'], 'apikey');
            assert.strictEqual(config['verify_iss'], 'fastly:service');
            assert.deepStrictEqual(config['verify_key'], 'base64:geag12132w==');
        });
        it('merges parameters from second parameter', () => {
            const uri = 'https://api.fastly.com/service/service?' +
              'key=apikey&verify-iss=fastly:service';
            const config = parseGripUri(uri, { 'verify-key': 'base64:geag12132w==', 'verify-iss': undefined });
            assert.strictEqual(config['control_uri'], 'https://api.fastly.com/service/service');
            assert.strictEqual(config['control_iss'], undefined);
            assert.strictEqual(config['key'], 'apikey');
            assert.strictEqual(config['verify_iss'], 'fastly:service');
            assert.deepStrictEqual(config['verify_key'], 'base64:geag12132w==');
        });
    });
    describe('#createGripChannelHeader', () => {
        it('creates header from single string channel name', () => {
            const header = createGripChannelHeader('channel');
            assert.strictEqual(header, 'channel');
        });
        it('creates header from single Channel object', () => {
            const header = createGripChannelHeader(new Channel('channel'));
            assert.strictEqual(header, 'channel');
        });
        it('creates header from single Channel object with name and prevId', () => {
            const header = createGripChannelHeader(new Channel('channel',
                'prev-id'));
            assert.strictEqual(header, 'channel; prev-id=prev-id');
        });
        it('creates header from multiple Channel objects with names and prevIds', () => {
            const header = createGripChannelHeader([new Channel('channel1',
                'prev-id1'), new Channel('channel2', 'prev-id2')]);
            assert.strictEqual(header, 'channel1; prev-id=prev-id1, channel2; prev-id=prev-id2');
        });
    });
});
