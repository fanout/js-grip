var assert = require('assert');
var channel = require('../lib/channel');

(function testInitialize() {
    var ch = new channel.Channel('name');
    assert.equal(ch.name, 'name');
    assert.equal(ch.prevId, null);
    ch = new channel.Channel('name', 'prev-id');
    assert.equal(ch.name, 'name');
    assert.equal(ch.prevId, 'prev-id');
})();

(function testExport() {
    ch = new channel.Channel('name');
    assert.equal(JSON.stringify(ch.export()), JSON.stringify({
            name: 'name'}));
    ch = new channel.Channel('name', 'prev-id');
    assert.equal(JSON.stringify(ch.export()), JSON.stringify({
            name: 'name', prevId: 'prev-id'}));
    ch = new channel.Channel('name', 'prev-id');
})();

