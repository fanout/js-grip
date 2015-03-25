var assert = require('assert');
var httpstreamformat = require('../lib/httpstreamformat');

(function testInitialize() {
    var hf = new httpstreamformat.HttpStreamFormat('content');
    assert.equal(hf.content, 'content');
    assert.equal(hf.close, null);
    hf = new httpstreamformat.HttpStreamFormat('content', true);
    assert.equal(hf.content, 'content');
    assert.equal(hf.close, true);
    assert.throws(
        function() {
            httpstreamformat.HttpStreamFormat();
        }, Error
    );
})();

(function testName() {
    hf = new httpstreamformat.HttpStreamFormat('content', true);
    assert.equal(hf.name(), 'http-stream');
})();

(function testExport() {
    hf = new httpstreamformat.HttpStreamFormat('message');
    assert.equal(hf.export()['content'], 'message');
    hf = new httpstreamformat.HttpStreamFormat(new Buffer('message'));
    assert.equal(hf.export()['content-bin'], new Buffer('message').
            toString('base64'));
    hf = new httpstreamformat.HttpStreamFormat(null, true);
    assert.equal(hf.export()['action'], 'close');
})();

