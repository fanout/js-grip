var assert = require('assert');
var utilities = require('../lib/utilities');

(function testIsFunction() {
    assert(!(utilities.isFunction('hello')));
    assert(utilities.isFunction(function(){}));
})();

(function testIsArray() {
    assert(!(utilities.isArray('hello')));
    assert(utilities.isArray([]));
})();

(function testIsString() {
    assert(utilities.isString('hello'));
    assert(!(utilities.isString([])));
})();

(function testToBuffer() {
    var buf = new Buffer('hello');
    assert.equal(buf, utilities.toBuffer(buf));
    buf = utilities.toBuffer('hello');
    assert(Buffer.isBuffer(buf));
    assert(buf.toString(), 'hello');
})();

(function testIsStringOrBinary() {
    var ret = utilities.isStringOrBinary("data");
    assert.equal(ret.string, "data");
    assert.equal(ret.buffer, null);
    var ret = utilities.isStringOrBinary(new Buffer("data"));
    assert.equal(ret.string, null);
    assert(Buffer.isBuffer(ret.buffer));
    assert.equal(ret.buffer.toString(), "data");
})();
