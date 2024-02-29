import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createKeepAliveHeader, createMetaHeader, createNextLinkHeader } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('utilities/http', () => {
    describe('#createKeepAliveHeader', () => {
        it('string input', () => {
            const header = createKeepAliveHeader('foo', 100);
            assert.strictEqual(header, 'foo; format=cstring; timeout=100');
        });
        it('buffer input', () => {
            const data = textEncoder.encode('foo');
            const header = createKeepAliveHeader(data, 100);
            assert.strictEqual(header, 'Zm9v; format=base64; timeout=100');
        });
    });
    describe('#createMetaHeader', () => {
        it('object', () => {
            const metas = {
                'foo': 'bar',
                'bar': '"quoted string"',
            };
            const header = createMetaHeader(metas);
            assert.strictEqual(header, 'foo="bar", bar="\\"quoted string\\""');
        });
    });
    describe('#createNextLinkHeader', () => {
        it('uri input', () => {
            const header = createNextLinkHeader('http://example.com/path/');
            assert.strictEqual(header, '<http://example.com/path/>; rel=next');
        });
        it('uri input with timeout', () => {
            const header = createNextLinkHeader('http://example.com/path/', 100);
            assert.strictEqual(header, '<http://example.com/path/>; rel=next; timeout=100');
        });
    });
});
