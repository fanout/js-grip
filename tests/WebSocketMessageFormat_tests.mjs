import assert from "assert";

import WebSocketMessageFormat from "../esm/data/websocket/WebSocketMessageFormat.mjs";

(function testInitialize() {
    const ws = new WebSocketMessageFormat('content');
    assert.equal(ws.content, 'content');
})();

(function testName() {
    const ws = new WebSocketMessageFormat('content');
    assert.equal(ws.name(), 'ws-message');
})();

(function testExport() {
    let ws = new WebSocketMessageFormat('message');
    assert.equal(ws.export()['content'], 'message');

    ws = new WebSocketMessageFormat(Buffer.from('message'));
    assert.equal(ws.export()['content-bin'], Buffer.from('message').
            toString('base64'));

    ws = new WebSocketMessageFormat(null, true, 1009);
    assert.equal(ws.export()['action'], 'close');
    assert.equal(ws.export()['code'], 1009);
})();

