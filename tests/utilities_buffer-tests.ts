import assert from 'assert';
import { toBuffer } from "../src/utilities/buffer";

describe('utilities/buffer', function () {
    describe('#toBuffer', function () {
        it('test case', function () {
            let buf = Buffer.from('hello');
            assert.equal(buf, toBuffer(buf));
            buf = toBuffer('hello');
            assert(Buffer.isBuffer(buf));
            assert(buf.toString(), 'hello');
        });
    });
});
