import * as assert from "assert";
import { HttpStreamFormat } from "../src";

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
            const hf = new HttpStreamFormat(Buffer.from('message'));
            assert.equal(hf.export()['content-bin'], Buffer.from('message').
            toString('base64'));
        });
        it('test case', function () {
            const hf = new HttpStreamFormat(null, true);
            assert.equal(hf.export()['action'], 'close');
        });
    });
});
