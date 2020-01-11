import assert from "assert";
import jspackModule from "jspack";
const { jspack } = jspackModule;

import WebSocketContext from "../src/data/websocket/WebSocketContext.mjs";
import WebSocketEvent from "../src/data/websocket/WebSocketEvent.mjs";

(function testOpen() {
	const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('OPEN')]);
	assert.equal(ws.id, 'conn-1');
	assert(ws.isOpening());
	assert(!ws.canRecv());
	assert(!ws.accepted);
	ws.accept();
	assert(ws.accepted);
})();

(function testRecv() {
	const ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('TEXT', Buffer.from('hello'))]);
	assert(!ws.isOpening());
	assert(ws.canRecv());
	const msg = ws.recv();
	assert.equal(msg, 'hello');
	assert(!ws.canRecv());
})();

(function testSend() {
	const ws = new WebSocketContext('conn-1', {}, []);
	assert(!ws.isOpening());
	assert(!ws.canRecv());
	assert.equal(ws.outEvents.length, 0);
	ws.send(Buffer.from('apple'));
	ws.send('banana');
	ws.sendBinary(Buffer.from('cherry'));
	ws.sendBinary('date');
	assert.equal(ws.outEvents.length, 4);
	assert.equal(ws.outEvents[0].getType(), 'TEXT');
	assert(ws.outEvents[0].getContent().equals(Buffer.from('m:apple')));
	assert.equal(ws.outEvents[1].getType(), 'TEXT');
	assert(ws.outEvents[1].getContent().equals(Buffer.from('m:banana')));
	assert.equal(ws.outEvents[2].getType(), 'BINARY');
	assert(ws.outEvents[2].getContent().equals(Buffer.from('m:cherry')));
	assert.equal(ws.outEvents[3].getType(), 'BINARY');
	assert(ws.outEvents[3].getContent().equals(Buffer.from('m:date')));
})();

(function testControl() {
	const ws = new WebSocketContext('conn-1', {}, []);
	assert.equal(ws.outEvents.length, 0);
	ws.subscribe('foo');
	ws.unsubscribe('bar');
	assert.equal(ws.outEvents.length, 2);

	assert.equal(ws.outEvents[0].getType(), 'TEXT');
	assert(ws.outEvents[0].getContent().toString().startsWith('c:'));
	assert.deepEqual(JSON.parse(ws.outEvents[0].getContent().slice(2).toString()),
			{type: 'subscribe', channel: 'foo'});

	assert.equal(ws.outEvents[1].getType(), 'TEXT');
	assert(ws.outEvents[1].getContent().toString().startsWith('c:'));
	assert.deepEqual(JSON.parse(ws.outEvents[1].getContent().slice(2).toString()),
			{type: 'unsubscribe', channel: 'bar'});
})();

(function testClose() {
	let ws = new WebSocketContext('conn-1', {}, [new WebSocketEvent('CLOSE', jspack.Pack('>H', [100]))]);
	assert(!ws.isOpening());
	assert(ws.canRecv());
	const msg = ws.recv();
	assert(msg == null);
	assert.equal(ws.closeCode, 100);

	ws = new WebSocketContext('conn-1', {}, []);
	assert(!ws.isOpening());
	assert(!ws.canRecv());
	assert(!ws.closed);
	ws.close(100);
	assert.equal(ws.outCloseCode, 100);
})();

(function testServerDisconnect() {
	const ws = new WebSocketContext('conn-5', {}, []);
	assert.equal(ws.outEvents.length, 0);
	ws.disconnect();
	assert.equal(ws.outEvents.length, 1);
	assert.equal(ws.outEvents[0].getType(), 'DISCONNECT');
	const disconnectEvent = ws.outEvents[0]
	assert(ws.outEvents[0].getContent() === null, 'disconnect event has null content')
})();
