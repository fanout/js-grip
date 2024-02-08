import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';

import { toBuffer } from '../../../src/index.js';

describe('utilities/buffer', function () {
    describe('#toBuffer', function () {
        it('test case', function () {
            let buf = Buffer.from('hello');
            assert.equal(buf, toBuffer(buf));
            buf = toBuffer('hello');
            assert.ok(Buffer.isBuffer(buf));
            assert.ok(buf.toString(), 'hello');
        });
    });
});
