import { describe, it } from 'node:test';
import assert from 'node:assert';

import { jspack } from 'jspack';

import { WebSocketContext, WebSocketEvent } from '../../../../src/index.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

describe('WebSocketContext', function () {
	describe('open', function () {
		it('test case', function () {
			const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('OPEN')]);
			assert.equal(ws.id, 'conn-1');
			assert.ok(ws.isOpening());
			assert.ok(!ws.canRecv());
			assert.ok(!ws.accepted);
			ws.accept();
			assert.ok(ws.accepted);
		});
	});
	describe('receive', function () {
		it('test case', function () {
			const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('TEXT', textEncoder.encode('hello'))]);
			assert.ok(!ws.isOpening());
			assert.ok(ws.canRecv());
			const msg = ws.recv();
			assert.equal(msg, 'hello');
			assert.ok(!ws.canRecv());
		});
	});
	describe('send', function () {
		it('test case', function () {
			const ws = new WebSocketContext('conn-1', {}, []);
			assert.ok(!ws.isOpening());
			assert.ok(!ws.canRecv());
			assert.equal(ws.outEvents.length, 0);
			ws.send(textEncoder.encode('apple'));
			ws.send('banana');
			ws.sendBinary(textEncoder.encode('cherry'));
			ws.sendBinary('date');
			assert.equal(ws.outEvents.length, 4);

			assert.equal(ws.outEvents[0].getType(), 'TEXT');
			let content = ws.outEvents[0].getContent();
			assert.ok(content instanceof Uint8Array);
			assert.deepStrictEqual(content, textEncoder.encode('m:apple'));

			assert.equal(ws.outEvents[1].getType(), 'TEXT');
			content = ws.outEvents[1].getContent();
			assert.ok(content instanceof Uint8Array);
			assert.deepStrictEqual(content, textEncoder.encode('m:banana'));

			assert.equal(ws.outEvents[2].getType(), 'BINARY');
			content = ws.outEvents[2].getContent();
			assert.ok(content instanceof Uint8Array);
			assert.deepStrictEqual(content, textEncoder.encode('m:cherry'));

			assert.equal(ws.outEvents[3].getType(), 'BINARY');
			content = ws.outEvents[3].getContent();
			assert.ok(content instanceof Uint8Array);
			assert.deepStrictEqual(content, textEncoder.encode('m:date'));
		});
	});
	describe('control', function () {
		it('test case', function () {
			const ws = new WebSocketContext('conn-1', {}, []);
			assert.equal(ws.outEvents.length, 0);
			ws.subscribe('foo');
			ws.unsubscribe('bar');
			assert.equal(ws.outEvents.length, 2);

			assert.equal(ws.outEvents[0].getType(), 'TEXT');
			let content = ws.outEvents[0].getContent();
			assert.ok(content instanceof Uint8Array);
			assert.ok(textDecoder.decode(content).startsWith('c:'));
			assert.deepEqual(JSON.parse(textDecoder.decode(content.slice(2))),
				{type: 'subscribe', channel: 'foo'});

			assert.equal(ws.outEvents[1].getType(), 'TEXT');
			content = ws.outEvents[1].getContent();
			assert.ok(content instanceof Uint8Array);
			assert.ok(textDecoder.decode(content).startsWith('c:'));
			assert.deepEqual(JSON.parse(textDecoder.decode(content.slice(2))),
				{type: 'unsubscribe', channel: 'bar'});
		});
	});
	describe('close', function () {
		it('test case', function () {
			const data = jspack.Pack('>H', [100]);
			assert.ok(data);
			const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('CLOSE', new Uint8Array(data))]);
			assert.ok(!ws.isOpening());
			assert.ok(ws.canRecv());
			const msg = ws.recv();
			assert.ok(msg == null);
			assert.equal(ws.closeCode, 100);
		});
		it('test case', function () {
			const ws = new WebSocketContext('conn-1', {}, []);
			assert.ok(!ws.isOpening());
			assert.ok(!ws.canRecv());
			assert.ok(!ws.closed);
			ws.close(100);
			assert.equal(ws.outCloseCode, 100);
		});
	});
	describe('disconnect', function () {
		it('test case', function () {
			const ws = new WebSocketContext('conn-5', {}, []);
			assert.equal(ws.outEvents.length, 0);
			ws.disconnect();
			assert.equal(ws.outEvents.length, 1);
			assert.equal(ws.outEvents[0].getType(), 'DISCONNECT');
			assert.ok(ws.outEvents[0].getContent() === null, 'disconnect event has null content')
		});
	});
});
