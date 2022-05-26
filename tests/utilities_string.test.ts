import * as assert from "assert";
import { encodeCString, escapeQuotes, isString, } from '../src/utilities/string';

describe('utilities/string', function() {
    describe('#isString', function() {
        it('test case', function() {
            assert.ok(isString('hello'));
            assert.ok(!(isString(123)));
            assert.ok(!(isString(() => {})));
            assert.ok(!(isString([])));
        });
    });
    describe('#encodeCString', function() {
        it('simple string', function() {
            const input = 'simple';
            assert.equal(encodeCString(input), 'simple');
        });
        it('backslashes in string', function() {
            // The \\ in the input string resolves to a single backslash
            const input = 'string\\with\\backslashes';
            // The \\\\ in the test string resolves to a double backslash
            assert.equal(encodeCString(input), 'string\\\\with\\\\backslashes');
        });
        it('carriage-return', function() {
            const input = 'multi\rline';
            assert.equal(encodeCString(input), 'multi\\rline');
        });
        it('new-line', function() {
            const input = 'multi\nline';
            assert.equal(encodeCString(input), 'multi\\nline');
        });
        it('string that cannot be encoded', function() {
            const input = 'unprintable' + String.fromCharCode(7) + 'string';
            assert.throws(() => {
                encodeCString(input);
            }, err => {
                assert.ok(err instanceof Error);
                assert.equal(err.message, "can't encode");
                return true;
            });
        });
    });
    describe('#escapeQuotes', function() {
        it('simple string', function() {
            const input = 'simple string';
            assert.equal(escapeQuotes(input), 'simple string');
        });
        it('single-quoted string', function() {
            const input = '\'single-quoted string\'';
            assert.equal(escapeQuotes(input), '\'single-quoted string\'');
        });
        it('double-quoted string', function() {
            const input = '"double-quoted string"';
            assert.equal(escapeQuotes(input), '\\"double-quoted string\\"');
        });
    });
});
