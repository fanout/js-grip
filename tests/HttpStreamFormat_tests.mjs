import assert from "assert";
import HttpStreamFormat from "../esm/data/http/HttpStreamFormat.mjs";

(function testInitialize() {
    let hf = new HttpStreamFormat('content');
    assert.equal(hf.content, 'content');
    assert.equal(hf.close, false);

    hf = new HttpStreamFormat('content', true);
    assert.equal(hf.content, 'content');
    assert.equal(hf.close, true);
    assert.throws(
        function() {
            HttpStreamFormat();
        }, Error
    );
})();

(function testName() {
    const hf = new HttpStreamFormat('content', true);
    assert.equal(hf.name(), 'http-stream');
})();

(function testExport() {
    let hf = new HttpStreamFormat('message');
    assert.equal(hf.export()['content'], 'message');
    hf = new HttpStreamFormat(Buffer.from('message'));
    assert.equal(hf.export()['content-bin'], Buffer.from('message').
            toString('base64'));
    hf = new HttpStreamFormat(null, true);
    assert.equal(hf.export()['action'], 'close');
})();

