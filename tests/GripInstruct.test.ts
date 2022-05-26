import * as assert from "assert";

import Channel from '../src/data/Channel';
import GripInstruct from "../src/data/GripInstruct";

describe('GripInstruct', function () {

    describe('Initialize', function () {
        it('should allow creating a GripInstruct with no channels', function () {
            const gripInstruct = new GripInstruct();
            const channels = gripInstruct.channels;
            assert.ok(Array.isArray(channels));
            assert.ok(channels.length === 0);
        });
        it('should allow creating a GripInstruct with a channel name', function () {
            const gripInstruct = new GripInstruct('foo');
            const channels = gripInstruct.channels;
            assert.ok(Array.isArray(channels));
            assert.ok(channels.length === 1);
            assert.ok(channels[0] instanceof Channel);
            assert.equal(channels[0].name, 'foo');
        });
        it('should allow creating a GripInstruct with channel names', function () {
            const gripInstruct = new GripInstruct(['foo', 'bar']);
            const channels = gripInstruct.channels;
            assert.ok(Array.isArray(channels));
            assert.ok(channels.length === 2);
            assert.ok(channels[0] instanceof Channel);
            assert.equal(channels[0].name, 'foo');
            assert.ok(channels[1] instanceof Channel);
            assert.equal(channels[1].name, 'bar');
        });
        it('should allow creating a GripInstruct with a Channel object', function () {
            const channel = new Channel('foo');
            const gripInstruct = new GripInstruct(channel);
            const channels = gripInstruct.channels;
            assert.ok(Array.isArray(channels));
            assert.ok(channels.length === 1);
            assert.strictEqual(channels[0], channel);
        });
    });

    describe('#addChannel', function () {
        it('addChannel() with a channel name/names/Channel', function () {
            const gripInstruct = new GripInstruct();
            const channels = gripInstruct.channels;
            assert.ok(Array.isArray(channels));
            assert.ok(channels.length === 0);
            gripInstruct.addChannel('foo');
            assert.ok(Array.isArray(channels));
            // suppressing TS2367: This condition will always return 'false' since the types '0' and '1' have no overlap.
            // @ts-ignore
            assert.ok(channels.length === 1);
            assert.ok(channels[0] instanceof Channel);
            assert.equal(channels[0].name, 'foo');
            gripInstruct.addChannel(['bar', 'baz']);
            // @ts-ignore
            assert.ok(channels.length === 3);
            assert.ok(channels[0] instanceof Channel);
            assert.equal(channels[0].name, 'foo');
            assert.ok(channels[1] instanceof Channel);
            assert.equal(channels[1].name, 'bar');
            assert.ok(channels[2] instanceof Channel);
            assert.equal(channels[2].name, 'baz');
            gripInstruct.addChannel(new Channel('hoge'));
            // @ts-ignore
            assert.ok(channels.length === 4);
            assert.ok(channels[0] instanceof Channel);
            assert.equal(channels[0].name, 'foo');
            assert.ok(channels[1] instanceof Channel);
            assert.equal(channels[1].name, 'bar');
            assert.ok(channels[2] instanceof Channel);
            assert.equal(channels[2].name, 'baz');
            assert.ok(channels[3] instanceof Channel);
            assert.equal(channels[3].name, 'hoge');
        });
    });

    describe('#setHoldLongPoll', function () {
        it('setHoldLongPoll without timeout', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setHoldLongPoll();
            assert.equal(gripInstruct.hold, 'response');
        });
        it('setHoldLongPoll with timeout', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setHoldLongPoll(100);
            assert.equal(gripInstruct.hold, 'response');
            assert.equal(gripInstruct.timeout, 100);
        });
    });

    describe('#setHoldStream', function () {
        it('setHoldStream', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setHoldStream();
            assert.equal(gripInstruct.hold, 'stream');
        });
    });

    describe('#setKeepAlive', function () {
        it('setKeepAlive with string', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setKeepAlive('foo', 100);
            assert.ok(typeof gripInstruct.keepAlive === 'string');
            assert.equal(gripInstruct.keepAlive, 'foo');
            assert.equal(gripInstruct.keepAliveTimeout, 100);
        });
        it('setKeepAlive with Buffer', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setKeepAlive(Buffer.from('foo'), 100);
            assert.ok(gripInstruct.keepAlive instanceof Buffer);
            assert.equal((gripInstruct.keepAlive as Buffer).toString(), 'foo');
            assert.equal(gripInstruct.keepAliveTimeout, 100);
        });
    });

    describe('#setNextLink', function () {
        it('setNextLink without timeout', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setNextLink('https://www.example.com/path/');
            assert.equal(gripInstruct.nextLink, 'https://www.example.com/path/');
            assert.equal(gripInstruct.nextLinkTimeout, 0);
        });
        it('setNextLink with timeout', function () {
            const gripInstruct = new GripInstruct();
            gripInstruct.setNextLink('https://www.example.com/path/', 100);
            assert.equal(gripInstruct.nextLink, 'https://www.example.com/path/');
            assert.equal(gripInstruct.nextLinkTimeout, 100);
        });
    });

    describe('#toHeaders', function() {
        it('toHeaders for long poll', function() {
            const gripInstruct = new GripInstruct('foo');
            gripInstruct.setHoldLongPoll(100);
            const headers = gripInstruct.toHeaders();
            assert.deepStrictEqual(headers, {
                'Grip-Channel': 'foo',
                'Grip-Hold': 'response',
                'Grip-Timeout': '100',
            });
        });
        it('toHeaders for long poll with keep-alive', function() {
            const gripInstruct = new GripInstruct('foo');
            gripInstruct.setHoldLongPoll(100);
            gripInstruct.setKeepAlive('bar', 100)
            const headers = gripInstruct.toHeaders();
            assert.deepStrictEqual(headers, {
                'Grip-Channel': 'foo',
                'Grip-Hold': 'response',
                'Grip-Timeout': '100',
                'Grip-Keep-Alive': 'bar; format=cstring; timeout=100',
            });
        });
        it('toHeaders for long poll with set-meta', function() {
            const gripInstruct = new GripInstruct('foo');
            gripInstruct.setHoldLongPoll(100);
            // Meta is to be set directly
            gripInstruct.meta = {
                'bar': 'baz',
                'hoge': 'piyo',
            };
            const headers = gripInstruct.toHeaders();
            assert.deepStrictEqual(headers, {
                'Grip-Channel': 'foo',
                'Grip-Hold': 'response',
                'Grip-Timeout': '100',
                'Grip-Set-Meta': 'bar="baz", hoge="piyo"',
            });
        });
        it('toHeaders for stream', function() {
            const gripInstruct = new GripInstruct('foo');
            gripInstruct.setHoldStream();
            const headers = gripInstruct.toHeaders();
            assert.deepStrictEqual(headers, {
                'Grip-Channel': 'foo',
                'Grip-Hold': 'stream',
            });
        });
        it('toHeaders for stream with next link', function() {
            const gripInstruct = new GripInstruct('foo');
            gripInstruct.setHoldStream();
            gripInstruct.setNextLink('https://www.example.com/path/', 100);
            const headers = gripInstruct.toHeaders();
            assert.deepStrictEqual(headers, {
                'Grip-Channel': 'foo',
                'Grip-Hold': 'stream',
                'Grip-Link': '<https://www.example.com/path/>; rel=next; timeout=100',
            });
        });
    });
});

