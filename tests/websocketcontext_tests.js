var assert = require('assert');
var jspack = require('jspack').jspack;
var grip = require('../lib/grip');

(function testOpen() {
	var ws = new grip.WebSocketContext('conn-1', {}, [new grip.WebSocketEvent('OPEN')]);
	assert.equal(ws.id, 'conn-1');
	assert(ws.isOpening());
	assert(!ws.canRecv());
	assert(!ws.accepted);
	ws.accept();
	assert(ws.accepted);
})();

(function testRecv() {
	var ws = new grip.WebSocketContext('conn-1', {}, [new grip.WebSocketEvent('TEXT', Buffer.from('hello'))]);
	assert(!ws.isOpening());
	assert(ws.canRecv());
	var msg = ws.recv();
	assert.equal(msg, 'hello');
	assert(!ws.canRecv());
})();

(function testSend() {
	var ws = new grip.WebSocketContext('conn-1', {}, []);
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
	var ws = new grip.WebSocketContext('conn-1', {}, []);
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
	var ws = new grip.WebSocketContext('conn-1', {}, [new grip.WebSocketEvent('CLOSE', jspack.Pack('>H', [100]))]);
	assert(!ws.isOpening());
	assert(ws.canRecv());
	var msg = ws.recv();
	assert(msg == null);
	assert.equal(ws.closeCode, 100);

	var ws = new grip.WebSocketContext('conn-1', {}, []);
	assert(!ws.isOpening());
	assert(!ws.canRecv());
	assert(!ws.closed);
	ws.close(code=100);
	assert.equal(ws.outCloseCode, 100);
})();

(function testServerDisconnect() {
	var ws = new grip.WebSocketContext('conn-5', {}, []);
	assert.equal(ws.outEvents.length, 0);
	ws.disconnect();
	assert.equal(ws.outEvents.length, 1);
	assert.equal(ws.outEvents[0].getType(), 'DISCONNECT');
	const disconnectEvent = ws.outEvents[0]
	assert(ws.outEvents[0].getContent() === null, 'disconnect event has null content')
})();
