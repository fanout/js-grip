import { describe, it } from 'node:test';
import assert from 'node:assert';

import { createKeepAliveHeader, createMetaHeader, createNextLinkHeader } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('utilities/http', function() {
    describe('#createKeepAliveHeader', function() {
        it('string input', function() {
            const header = createKeepAliveHeader('foo', 100);
            assert.equal(header, 'foo; format=cstring; timeout=100');
        });
        it('buffer input', function() {
            const data = textEncoder.encode('foo');
            const header = createKeepAliveHeader(data, 100);
            assert.equal(header, 'Zm9v; format=base64; timeout=100');
        });
    });
    describe('#createMetaHeader', function() {
        it('object', function() {
            const metas = {
                'foo': 'bar',
                'bar': '"quoted string"',
            };
            const header = createMetaHeader(metas);
            assert.equal(header, 'foo="bar", bar="\\"quoted string\\""');
        });
    });
    describe('#createNextLinkHeader', function() {
        it('uri input', function() {
            const header = createNextLinkHeader('http://example.com/path/');
            assert.equal(header, '<http://example.com/path/>; rel=next');
        });
        it('uri input with timeout', function() {
            const header = createNextLinkHeader('http://example.com/path/', 100);
            assert.equal(header, '<http://example.com/path/>; rel=next; timeout=100');
        });
    });
});
