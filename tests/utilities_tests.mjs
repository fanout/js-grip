import assert from 'assert';
import { isFunction, isString, toBuffer } from '../esm/utilities.mjs';

(function testIsFunction() {
    assert(!(isFunction('hello')));
    assert(isFunction(function(){}));
})();

(function testIsString() {
    assert(isString('hello'));
    assert(!(isString([])));
})();

(function testToBuffer() {
    let buf = Buffer.from('hello');
    assert.equal(buf, toBuffer(buf));
    buf = toBuffer('hello');
    assert(Buffer.isBuffer(buf));
    assert(buf.toString(), 'hello');
})();
