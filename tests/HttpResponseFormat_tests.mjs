import assert from "assert";
import HttpResponseFormat from "../esm/data/http/HttpResponseFormat.mjs";

(function testInitialize() {
    let hf = new HttpResponseFormat();
    assert.equal(hf.code, null);
    assert.equal(hf.reason, null);
    assert.equal(hf.headers, null);
    assert.equal(hf.body, null);

    hf = new HttpResponseFormat('code', 'reason',
            'headers', 'body');
    assert.equal(hf.code, 'code');
    assert.equal(hf.reason, 'reason');
    assert.equal(hf.headers, 'headers');
    assert.equal(hf.body, 'body');

    hf = new HttpResponseFormat({ code: 'code',
            reason: 'reason', headers: 'headers', body: 'body' });
    assert.equal(hf.code, 'code');
    assert.equal(hf.reason, 'reason');
    assert.equal(hf.headers, 'headers');
    assert.equal(hf.body, 'body');
})();

(function testName() {
    const hf = new HttpResponseFormat('body');
    assert.equal(hf.name(), 'http-response');
})();

(function testExport() {
    let hf = new HttpResponseFormat({ body: 'body' });
    assert.equal(JSON.stringify(hf.export()), JSON.stringify({ body: 'body' }));

    hf = new HttpResponseFormat({ code: 'code',
            reason: 'reason', headers: 'headers', body: 'body' });
    assert.equal(JSON.stringify(hf.export()), JSON.stringify(
            { code: 'code', reason: 'reason', headers: 'headers', body: 'body' }));

    hf = new HttpResponseFormat({ code: 'code',
            reason: 'reason', headers: 'headers', body: Buffer.from('body') });
    assert.equal(JSON.stringify(hf.export()), JSON.stringify(
            { code: 'code', reason: 'reason', headers: 'headers', 'body-bin':
            Buffer.from('body').toString('base64') }));
})();
