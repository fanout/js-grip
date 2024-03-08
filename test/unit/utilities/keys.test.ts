import { describe, it } from 'node:test';
import assert from 'node:assert';
import { webcrypto as crypto } from 'node:crypto';
import * as jose from 'jose';
import {
  encodeBytesToBase64String,
  decodeBytesFromBase64String,
  isSymmetricSecret,
  JwkKey,
  loadKey,
  PemKey,
} from '../../../src/index.js';
import {
  SAMPLEKEY_RSA_PRIVATE_PEM,
  SAMPLEKEY_RSA_PRIVATE_JWK,
  SAMPLEKEY_RSA_PUBLIC_PEM,
  SAMPLEKEY_RSA_PUBLIC_JWK,
  SAMPLEKEY_EC_PUBLIC_PEM,
  SAMPLEKEY_EC_PUBLIC_JWK,
  SAMPLEKEY_HMAC_JWK,
} from '../sampleKeys.js';

const textEncoder = new TextEncoder();

function isKeyLike(key: Uint8Array | jose.KeyLike | PemKey | JwkKey): key is jose.KeyLike {
  if (key instanceof Uint8Array || key instanceof PemKey || key instanceof JwkKey) {
    return false;
  }
  return true;
}

describe('PemKey', () => {
  describe('constructor', () => {
    it('constructs with a key string', () => {
      const pemKey = new PemKey(SAMPLEKEY_RSA_PUBLIC_PEM);
      assert.strictEqual(pemKey.keyString, SAMPLEKEY_RSA_PUBLIC_PEM);
    });
    it('throws TypeError if key string does not start with -----BEGIN', () => {
      assert.throws(() => {
        new PemKey('asdf');
      }, err => {
        assert.ok(err instanceof TypeError);
        return true;
      });
    });
  });
  describe('getKeyLike', () => {
    it('Private Key - RS256', async() => {
      const pemKey = new PemKey(SAMPLEKEY_RSA_PRIVATE_PEM);
      const keyLike = await pemKey.getKeyLike('RS256');
      assert.strictEqual(keyLike.type, 'private');
    });
    it('Public Key - RS256', async() => {
      const pemKey = new PemKey(SAMPLEKEY_RSA_PUBLIC_PEM);
      const keyLike = await pemKey.getKeyLike('RS256');
      assert.strictEqual(keyLike.type, 'public');
    });
    it('Public Key - ES256', async() => {
      const pemKey = new PemKey(SAMPLEKEY_EC_PUBLIC_PEM);
      const keyLike = await pemKey.getKeyLike('ES256');
      assert.strictEqual(keyLike.type, 'public');
    });
  });
});
describe('JwkKey', () => {
  describe('constructor', () => {
    it('constructs with a JWK', () => {
      const jwkKey = new JwkKey(SAMPLEKEY_EC_PUBLIC_JWK);
      assert.deepStrictEqual(jwkKey.jwk, SAMPLEKEY_EC_PUBLIC_JWK);
    });
  });
  describe('getKeyLike', () => {
    it('Private Key - RS256', async() => {
      const jwkKey = new JwkKey(SAMPLEKEY_RSA_PRIVATE_JWK);
      const keyLike = await jwkKey.getSecretOrKeyLike();
      assert.ok(isKeyLike(keyLike));
      assert.strictEqual(keyLike.type, 'private');
    });
    it('Public Key - RS256', async() => {
      const jwkKey = new JwkKey(SAMPLEKEY_RSA_PUBLIC_JWK);
      const keyLike = await jwkKey.getSecretOrKeyLike();
      assert.ok(isKeyLike(keyLike));
      assert.strictEqual(keyLike.type, 'public');
    });
    it('Public Key - ES256', async() => {
      const jwkKey = new JwkKey(SAMPLEKEY_EC_PUBLIC_JWK);
      const keyLike = await jwkKey.getSecretOrKeyLike();
      assert.ok(isKeyLike(keyLike));
      assert.strictEqual(keyLike.type, 'public');
    });
    it('Symmetric Key - HS256', async() => {
      const jwkKey = new JwkKey(SAMPLEKEY_HMAC_JWK);
      const secret = await jwkKey.getSecretOrKeyLike();
      assert.ok(secret instanceof Uint8Array);
      assert.deepStrictEqual(secret, decodeBytesFromBase64String('hO62z0B7Vvj8PgkMN7yaUzYS8MSf2fi4_WH-M5jlnmt3OW3sO6B9H5yjdoRD6Zq_eCQLft7K9ymVRinqiTofKQ'));
    });
  });
});

describe('isSymmetricSecret', () => {
  it('says Uint8Array is symmetric', () => {
    assert.ok(isSymmetricSecret(new Uint8Array()));
  });
  it('says PemKey is not symmetric', () => {
    const loadedKey = loadKey(SAMPLEKEY_RSA_PRIVATE_PEM);
    assert.ok(!isSymmetricSecret(loadedKey));
  });
  it('says JwkKey is symmetric for symmetric key', () => {
    const loadedKey = loadKey(SAMPLEKEY_HMAC_JWK);
    assert.ok(isSymmetricSecret(loadedKey));
  })
  it('says JwkKey is not symmetric for non-\'secret\' key', () => {
    const loadedKey = loadKey(SAMPLEKEY_RSA_PRIVATE_JWK);
    assert.ok(!isSymmetricSecret(loadedKey));
  })
  it('says jose.KeyLike is symmetric for \'secret\' key', async () => {
    const loadedKey = await crypto.subtle.importKey('raw', textEncoder.encode(SAMPLEKEY_HMAC_JWK.k),
      { name: 'HMAC', hash: 'SHA-256', }, false, ['verify']);
    assert.ok(isSymmetricSecret(loadedKey));
  });
  it('says jose.KeyLike is not symmetric for non-\'secret\' key', async () => {
    const loadedKey = await crypto.subtle.importKey('jwk', SAMPLEKEY_RSA_PRIVATE_JWK,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256', }, false, ['sign']);
    assert.ok(!isSymmetricSecret(loadedKey));
  });
});

describe('loadKey', () => {
  it('Loads string key as Uint8Array bytes', () => {
    const key = 'asfasjdkfl;a';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode(key));
  });
  it('Loads string key that starts with hyphens as Uint8Array bytes of itself if it doesn\'t look like a PEM', () => {
    const key = '----------';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode(key));
  });
  it('Loads strings that start with base64: as a base64-encoded Uint8Array', () => {
    const key = 'base64:' + encodeBytesToBase64String(textEncoder.encode('Hello'));
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode('Hello'));
  });
  it('Loads string key that starts with base64-encoded hyphens as Uint8Array if it doesn\'t look like a PEM', () => {
    const key = 'base64:' + encodeBytesToBase64String(textEncoder.encode('----------'));
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode('----------'));
  });
  it('Loads strings that start with PKCS#8 first line as PemKey', async () => {
    const loadedKey = loadKey(SAMPLEKEY_RSA_PRIVATE_PEM);
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads strings that start with SPKI first line as PemKey', async () => {
    const loadedKey = loadKey(SAMPLEKEY_RSA_PUBLIC_PEM);
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads Uint8Array key as itself', () => {
    const loadedKey = loadKey(textEncoder.encode('Hello'));
    assert.deepStrictEqual(loadedKey, textEncoder.encode('Hello'));
  });
  it('Loads Uint8Array that starts with hyphens as itself if it doesn\'t look like a PEM', () => {
    const loadedKey = loadKey(textEncoder.encode('----------'));
    assert.deepStrictEqual(loadedKey, textEncoder.encode('----------'));
  });
  it('Loads Uint8Array that starts with PKCS#8 first line as PemKey', async () => {
    const loadedKey = loadKey(textEncoder.encode(SAMPLEKEY_RSA_PRIVATE_PEM));
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads jose.KeyLike object as itself', async () => {
    const publicKey = await jose.importSPKI(SAMPLEKEY_RSA_PUBLIC_PEM, 'RS256')
    const loadedKey = loadKey(publicKey);
    assert.ok(isKeyLike(loadedKey));
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads base64 string that encodes a PEM as PemKey', async () => {
    const key =
      'base64:' + encodeBytesToBase64String(textEncoder.encode(SAMPLEKEY_RSA_PUBLIC_PEM));
    const loadedKey = loadKey(key);
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads JsonWebKey as JwkKey', async () => {
    const loadedKey = loadKey(SAMPLEKEY_RSA_PRIVATE_JWK);
    assert.ok(loadedKey instanceof JwkKey);
  });
  it('Loads string encoding of JsonWebKey as JwkKey', async () => {
    const loadedKey = loadKey(JSON.stringify(SAMPLEKEY_RSA_PRIVATE_JWK));
    assert.ok(loadedKey instanceof JwkKey);
  });
  it('Loads Uint8Array encoding of JsonWebKey as JwkKey', async () => {
    const loadedKey = loadKey(textEncoder.encode(JSON.stringify(SAMPLEKEY_RSA_PRIVATE_JWK)));
    assert.ok(loadedKey instanceof JwkKey);
  });
});
