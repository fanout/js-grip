import { describe, it } from 'node:test';
import assert from 'node:assert';
import { concatUint8Arrays } from '../../../src/index.js';

describe('concatTypedArrays', () => {
  it('combines arrays', () => {

    const a = new Uint8Array([100, 101, 102, 103]);
    const b = new Uint8Array([104, 105, 106]);
    const c = new Uint8Array([107, 108, 109]);

    const combined = concatUint8Arrays(a, b, c);

    assert.deepStrictEqual(combined,
      new Uint8Array([100, 101, 102, 103, 104, 105, 106, 107, 108, 109])
    );

  });
});
