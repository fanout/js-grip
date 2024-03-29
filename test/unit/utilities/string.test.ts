import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encodeCString, escapeQuotes, } from '../../../src/index.js';

describe('utilities/string', () => {
    describe('#encodeCString', () => {
        it('simple string', () => {
            const input = 'simple';
            assert.strictEqual(encodeCString(input), 'simple');
        });
        it('backslashes in string', () => {
            // The \\ in the input string resolves to a single backslash
            const input = 'string\\with\\backslashes';
            // The \\\\ in the test string resolves to a double backslash
            assert.strictEqual(encodeCString(input), 'string\\\\with\\\\backslashes');
        });
        it('carriage-return', () => {
            const input = 'multi\rline';
            assert.strictEqual(encodeCString(input), 'multi\\rline');
        });
        it('new-line', () => {
            const input = 'multi\nline';
            assert.strictEqual(encodeCString(input), 'multi\\nline');
        });
        it('string that cannot be encoded', () => {
            const input = 'unprintable' + String.fromCharCode(7) + 'string';
            assert.throws(() => {
                encodeCString(input);
            }, err => {
                assert.ok(err instanceof Error);
                assert.strictEqual(err.message, 'can\'t encode');
                return true;
            });
        });
    });
    describe('#escapeQuotes', () => {
        it('simple string', () => {
            const input = 'simple string';
            assert.strictEqual(escapeQuotes(input), 'simple string');
        });
        it('single-quoted string', () => {
            const input = '\'single-quoted string\'';
            assert.strictEqual(escapeQuotes(input), '\'single-quoted string\'');
        });
        it('double-quoted string', () => {
            const input = '"double-quoted string"';
            assert.strictEqual(escapeQuotes(input), '\\"double-quoted string\\"');
        });
    });
});
