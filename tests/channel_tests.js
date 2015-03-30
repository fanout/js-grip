var assert = require('assert');
var grip = require('../lib/grip');

(function testInitialize() {
    var ch = new grip.Channel('name');
    assert.equal(ch.name, 'name');
    assert.equal(ch.prevId, null);
    ch = new grip.Channel('name', 'prev-id');
    assert.equal(ch.name, 'name');
    assert.equal(ch.prevId, 'prev-id');
})();

(function testExport() {
    ch = new grip.Channel('name');
    assert.equal(JSON.stringify(ch.export()), JSON.stringify({
            name: 'name'}));
    ch = new grip.Channel('name', 'prev-id');
    assert.equal(JSON.stringify(ch.export()), JSON.stringify({
            name: 'name', prevId: 'prev-id'}));
    ch = new grip.Channel('name', 'prev-id');
})();

