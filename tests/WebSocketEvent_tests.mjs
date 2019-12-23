import assert from "assert";

import WebSocketEvent from "../esm/data/websocket/WebSocketEvent.mjs";

(function testInitialize() {
    let we = new WebSocketEvent('type');
    assert.equal(we.type, 'type');
    assert.equal(we.content, null);

    we = new WebSocketEvent('type', 'content');
    assert.equal(we.type, 'type');
    assert.equal(we.content, 'content');
})();

(function testGetType() {
    const we = new WebSocketEvent('type');
    assert.equal(we.getType(), 'type');
})();

(function testGetContent() {
    const we = new WebSocketEvent('type', 'content');
    assert.equal(we.getContent(), 'content');
})();

