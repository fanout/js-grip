import assert from 'assert';

import Channel from '../src/data/Channel.mjs';

(function testInitialize() {
    let ch = new Channel('name');
    assert.equal(ch.name, 'name');
    assert.equal(ch.prevId, null);
    ch = new Channel('name', 'prev-id');
    assert.equal(ch.name, 'name');
    assert.equal(ch.prevId, 'prev-id');
})();

(function testExport() {
    let ch = new Channel('name');
    assert.equal(JSON.stringify(ch.export()), JSON.stringify({
            name: 'name'}));
    ch = new Channel('name', 'prev-id');
    assert.equal(JSON.stringify(ch.export()), JSON.stringify({
            name: 'name', prevId: 'prev-id'}));
    ch = new Channel('name', 'prev-id');
})();

