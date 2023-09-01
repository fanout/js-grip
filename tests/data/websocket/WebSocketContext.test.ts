import * as assert from "assert";

import jspackModule from "jspack";
const { jspack } = jspackModule;
/// <reference path="../../../types/jspack.d.ts" />

import { WebSocketContext, WebSocketEvent } from "../../../src";

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
			const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('TEXT', Buffer.from('hello'))]);
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
			ws.send(Buffer.from('apple'));
			ws.send('banana');
			ws.sendBinary(Buffer.from('cherry'));
			ws.sendBinary('date');
			assert.equal(ws.outEvents.length, 4);
			assert.equal(ws.outEvents[0].getType(), 'TEXT');
			assert.ok((ws.outEvents[0].getContent() as Buffer).equals(Buffer.from('m:apple')));
			assert.equal(ws.outEvents[1].getType(), 'TEXT');
			assert.ok((ws.outEvents[1].getContent() as Buffer).equals(Buffer.from('m:banana')));
			assert.equal(ws.outEvents[2].getType(), 'BINARY');
			assert.ok((ws.outEvents[2].getContent() as Buffer).equals(Buffer.from('m:cherry')));
			assert.equal(ws.outEvents[3].getType(), 'BINARY');
			assert.ok((ws.outEvents[3].getContent() as Buffer).equals(Buffer.from('m:date')));
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
			assert.ok((ws.outEvents[0].getContent() as Buffer).toString().startsWith('c:'));
			assert.deepEqual(JSON.parse((ws.outEvents[0].getContent() as Buffer).slice(2).toString()),
				{type: 'subscribe', channel: 'foo'});

			assert.equal(ws.outEvents[1].getType(), 'TEXT');
			assert.ok((ws.outEvents[1].getContent() as Buffer).toString().startsWith('c:'));
			assert.deepEqual(JSON.parse((ws.outEvents[1].getContent() as Buffer).slice(2).toString()),
				{type: 'unsubscribe', channel: 'bar'});
		});
	});
	describe('close', function () {
		it('test case', function () {
			const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('CLOSE', jspack.Pack('>H', [100]) as any[])]);
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
