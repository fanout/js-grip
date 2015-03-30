var assert = require('assert');
var grip = require('../lib/grip');

(function testInitialize() {
    var hf = new grip.HttpStreamFormat('content');
    assert.equal(hf.content, 'content');
    assert.equal(hf.close, null);
    hf = new grip.HttpStreamFormat('content', true);
    assert.equal(hf.content, 'content');
    assert.equal(hf.close, true);
    assert.throws(
        function() {
            grip.HttpStreamFormat();
        }, Error
    );
})();

(function testName() {
    hf = new grip.HttpStreamFormat('content', true);
    assert.equal(hf.name(), 'http-stream');
})();

(function testExport() {
    hf = new grip.HttpStreamFormat('message');
    assert.equal(hf.export()['content'], 'message');
    hf = new grip.HttpStreamFormat(new Buffer('message'));
    assert.equal(hf.export()['content-bin'], new Buffer('message').
            toString('base64'));
    hf = new grip.HttpStreamFormat(null, true);
    assert.equal(hf.export()['action'], 'close');
})();

