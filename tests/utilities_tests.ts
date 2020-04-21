import assert from 'assert';
import { isString, toBuffer } from '../src/utilities';

describe('utilities', function () {
    describe('#isString', function () {
        it('test case', function () {
            assert(isString('hello'));
            assert(!(isString([])));
        });
    });
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
