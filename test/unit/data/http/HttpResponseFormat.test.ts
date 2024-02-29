import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeBytesToBase64String, HttpResponseFormat } from '../../../../src/index.js';

const textEncoder = new TextEncoder();

describe('HttpResponseFormat', () => {
    describe('#constructor', () => {
        it('constructs with no parameters', () => {
            const hf = new HttpResponseFormat();
            assert.strictEqual(hf.code, null);
            assert.strictEqual(hf.reason, null);
            assert.strictEqual(hf.headers, null);
            assert.strictEqual(hf.body, null);
        });
        it('constructs with code, reason, headers, and body', () => {
            const hf = new HttpResponseFormat('code', 'reason',
                {'_': 'headers'}, 'body');
            assert.strictEqual(hf.code, 'code');
            assert.strictEqual(hf.reason, 'reason');
            assert.deepStrictEqual(hf.headers, {'_': 'headers'});
            assert.strictEqual(hf.body, 'body');
        });
        it('constructs with code, reason, headers, and body packed in the first parameter', () => {
            const hf = new HttpResponseFormat({ code: 'code',
                reason: 'reason', headers: {'_': 'headers'}, body: 'body' });
            assert.strictEqual(hf.code, 'code');
            assert.strictEqual(hf.reason, 'reason');
            assert.deepStrictEqual(hf.headers, {'_': 'headers'});
            assert.strictEqual(hf.body, 'body');
        });
    });
    describe('#name', () => {
        it('returns the name \'http-response\'', () => {
            const hf = new HttpResponseFormat('body');
            assert.strictEqual(hf.name(), 'http-response');
        });
    });
    describe('#export', () => {
        it('exports an object with body only, and the other fields are left out', () => {
            const hf = new HttpResponseFormat({ body: 'body' });
            assert.strictEqual(JSON.stringify(hf.export()), JSON.stringify({ body: 'body' }));
        });
        it('exports an object with code, reason, headers, and body', () => {
            const hf = new HttpResponseFormat({ code: 'code',
                reason: 'reason', headers: {'_': 'headers'}, body: 'body' });
            assert.strictEqual(JSON.stringify(hf.export()), JSON.stringify(
                { code: 'code', reason: 'reason', headers: {'_': 'headers'}, body: 'body' }));
        });
        it('exports an object with code, reason, headers, and binary body', () => {
            const hf = new HttpResponseFormat({ code: 'code',
                reason: 'reason', headers: {'_': 'headers'}, body: textEncoder.encode('body') });
            assert.strictEqual(JSON.stringify(hf.export()), JSON.stringify(
                {
                    code: 'code',
                    reason: 'reason',
                    headers: {'_': 'headers'},
                    'body-bin': encodeBytesToBase64String(textEncoder.encode('body')),
                }));
        });
    });
});
