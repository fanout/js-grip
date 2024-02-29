import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeBytesToBase64String, Response } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('Response', () => {
    describe('#constructor', () => {
        it('test case', () => {
            const hf = new Response();
            assert.strictEqual(hf.code, null);
            assert.strictEqual(hf.reason, null);
            assert.strictEqual(hf.headers, null);
            assert.strictEqual(hf.body, null);
        });
        it('test case', () => {
            const hf = new Response('code', 'reason',
                {'_': 'headers'}, 'body');
            assert.strictEqual(hf.code, 'code');
            assert.strictEqual(hf.reason, 'reason');
            assert.deepStrictEqual(hf.headers, {'_': 'headers'});
            assert.strictEqual(hf.body, 'body');
        });
        it('test case', () => {
            const hf = new Response({ code: 'code',
                reason: 'reason', headers: {'_': 'headers'}, body: 'body' });
            assert.strictEqual(hf.code, 'code');
            assert.strictEqual(hf.reason, 'reason');
            assert.deepStrictEqual(hf.headers, {'_': 'headers'});
            assert.strictEqual(hf.body, 'body');
        });
    });
    describe('#export', () => {
        it('test case', () => {
            const hf = new Response({ body: 'body' });
            assert.strictEqual(JSON.stringify(hf.export()), JSON.stringify({ body: 'body' }));
        });
        it('test case', () => {
            const hf = new Response({ code: 'code',
                reason: 'reason', headers: {'_': 'headers'}, body: 'body' });
            assert.strictEqual(JSON.stringify(hf.export()), JSON.stringify(
                { code: 'code', reason: 'reason', headers: {'_': 'headers'}, body: 'body' }));
        });
        it('test case', () => {
            const hf = new Response({ code: 'code',
                reason: 'reason', headers: {'_': 'headers'}, body: textEncoder.encode('body') });
            assert.strictEqual(JSON.stringify(hf.export()), JSON.stringify({
                code: 'code',
                reason: 'reason',
                headers: {'_': 'headers'},
                'body-bin': encodeBytesToBase64String(textEncoder.encode('body')),
            }));
        });
    });
});
