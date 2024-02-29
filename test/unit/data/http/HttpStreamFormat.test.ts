import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeBytesToBase64String, HttpStreamFormat } from '../../../../src/index.js';

const textEncoder = new TextEncoder();

describe('HttpStreamFormat', () => {
    describe('#constructor', () => {
        it('test case', () => {
            const hf = new HttpStreamFormat('content');
            assert.strictEqual(hf.content, 'content');
            assert.strictEqual(hf.close, false);
        });
        it('test case', () => {
            const hf = new HttpStreamFormat('content', true);
            assert.strictEqual(hf.content, 'content');
            assert.strictEqual(hf.close, true);
        });
    });
    describe('#name', () => {
        it('test case', () => {
            const hf = new HttpStreamFormat('content', true);
            assert.strictEqual(hf.name(), 'http-stream');
        });
    });
    describe('#export', () => {
        it('test case', () => {
            const hf = new HttpStreamFormat('message');
            assert.strictEqual(hf.export()['content'], 'message');
        });
        it('test case', () => {
            const hf = new HttpStreamFormat(textEncoder.encode('message'));
            assert.deepStrictEqual(
              hf.export()['content-bin'],
              encodeBytesToBase64String(textEncoder.encode('message')),
            );
        });
        it('test case', () => {
            const hf = new HttpStreamFormat(null, true);
            assert.strictEqual(hf.export()['action'], 'close');
        });
    });
});
