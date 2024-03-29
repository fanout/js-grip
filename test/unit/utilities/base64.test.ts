import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  decodeBytesFromBase64String,
  encodeBytesToBase64String,
} from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('encode()', () => {
  it('can encode a Uint8Array into a base64 string', () => {

    const bytes = new Uint8Array([0, 1, 2]);
    const str = encodeBytesToBase64String(bytes);
    assert.strictEqual(str, 'AAEC');

  });
  it('can decode a Uint8Array from a base64 string', () => {

    const bytes = decodeBytesFromBase64String('AAEC');
    assert.deepStrictEqual(bytes, new Uint8Array([0, 1, 2]));

  });
  it('can decode a Uint8Array from a base64url string', () => {

    const bytes = decodeBytesFromBase64String('Aag_7Ge-2Q==');
    assert.deepStrictEqual(bytes, new Uint8Array([0x01, 0xa8, 0x3f, 0xec, 0x67, 0xbe, 0xd9]));

  });
  it('can decode a Uint8Array from a base64 string that happens to have a space in it from bad encoding', () => {

    const bytes = decodeBytesFromBase64String('AEJ 3w==');
    assert.deepStrictEqual(bytes, new Uint8Array([0x00, 0x42, 0x7e, 0xdf]));

  });
  it('throws when trying to decode invalid base64 string', () => {

    assert.throws(() => {
      decodeBytesFromBase64String('geag121321=');
    }, err => {
      assert.ok(err instanceof TypeError);
      assert.strictEqual(err.message, 'Invalid base64 sequence');
      return true;
    });

  });
  it('works with this dataset', () => {

    const dataset = {
      '': '',
      'f': 'Zg==',
      'fo': 'Zm8=',
      'foo': 'Zm9v',
      'foob': 'Zm9vYg==',
      'fooba': 'Zm9vYmE=',
      'foobar': 'Zm9vYmFy',
    }

    for (const [key, value] of Object.entries(dataset)) {
      const keyBytes = textEncoder.encode(key)

      assert.strictEqual(encodeBytesToBase64String(keyBytes), value);
    }

  });
});
