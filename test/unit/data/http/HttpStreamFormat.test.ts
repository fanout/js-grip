import { describe, it } from 'node:test';
import assert from 'node:assert';

import { encodeBytesToBase64String, HttpStreamFormat } from '../../../../src/index.js';

const textEncoder = new TextEncoder();

describe('HttpStreamFormat', function () {
    describe('#constructor', function () {
        it('test case', function () {
            const hf = new HttpStreamFormat('content');
            assert.equal(hf.content, 'content');
            assert.equal(hf.close, false);
        });
        it('test case', function () {
            const hf = new HttpStreamFormat('content', true);
            assert.equal(hf.content, 'content');
            assert.equal(hf.close, true);
        });
    });
    describe('#name', function () {
        it('test case', function () {
            const hf = new HttpStreamFormat('content', true);
            assert.equal(hf.name(), 'http-stream');
        });
    });
    describe('#export', function () {
        it('test case', function () {
            const hf = new HttpStreamFormat('message');
            assert.equal(hf.export()['content'], 'message');
        });
        it('test case', function () {
            const hf = new HttpStreamFormat(textEncoder.encode('message'));
            assert.deepStrictEqual(
              hf.export()['content-bin'],
              encodeBytesToBase64String(textEncoder.encode('message')),
            );
        });
        it('test case', function () {
            const hf = new HttpStreamFormat(null, true);
            assert.equal(hf.export()['action'], 'close');
        });
    });
});
