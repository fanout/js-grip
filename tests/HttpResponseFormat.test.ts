import * as assert from "assert";
import HttpResponseFormat from "../src/data/http/HttpResponseFormat";

describe('HttpResponseFormat', function () {
    describe('#constructor', function () {
        it('test case', function () {
            const hf = new HttpResponseFormat();
            assert.equal(hf.code, null);
            assert.equal(hf.reason, null);
            assert.equal(hf.headers, null);
            assert.equal(hf.body, null);
        });
        it('test case', function () {
            const hf = new HttpResponseFormat('code', 'reason',
                'headers', 'body');
            assert.equal(hf.code, 'code');
            assert.equal(hf.reason, 'reason');
            assert.equal(hf.headers, 'headers');
            assert.equal(hf.body, 'body');
        });
        it('test case', function () {
            const hf = new HttpResponseFormat({ code: 'code',
                reason: 'reason', headers: 'headers', body: 'body' });
            assert.equal(hf.code, 'code');
            assert.equal(hf.reason, 'reason');
            assert.equal(hf.headers, 'headers');
            assert.equal(hf.body, 'body');
        });
    });
    describe('#name', function () {
        it('test case', function () {
            const hf = new HttpResponseFormat('body');
            assert.equal(hf.name(), 'http-response');
        });
    });
    describe('#export', function () {
        it('test case', function () {
            const hf = new HttpResponseFormat({ body: 'body' });
            assert.equal(JSON.stringify(hf.export()), JSON.stringify({ body: 'body' }));
        });
        it('test case', function () {
            const hf = new HttpResponseFormat({ code: 'code',
                reason: 'reason', headers: 'headers', body: 'body' });
            assert.equal(JSON.stringify(hf.export()), JSON.stringify(
                { code: 'code', reason: 'reason', headers: 'headers', body: 'body' }));
        });
        it('test case', function () {
            const hf = new HttpResponseFormat({ code: 'code',
                reason: 'reason', headers: 'headers', body: Buffer.from('body') });
            assert.equal(JSON.stringify(hf.export()), JSON.stringify(
                { code: 'code', reason: 'reason', headers: 'headers', 'body-bin':
                        Buffer.from('body').toString('base64') }));
        });
    });
});
