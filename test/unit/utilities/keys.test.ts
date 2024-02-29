import { describe, it } from 'node:test';
import assert from 'node:assert';
import { webcrypto as crypto } from 'node:crypto';
import * as jose from 'jose';
import {
  decodeBytesFromBase64String,
  isSymmetricSecret,
  JwkKey,
  loadKey,
  PemKey,
  PUBLIC_KEY_FASTLY_FANOUT_JWK,
  PUBLIC_KEY_FASTLY_FANOUT_PEM
} from '../../../src/index.js';
import { PRIVATE_KEY_1, PRIVATE_KEY_1_JWK, PUBLIC_KEY_1, PUBLIC_KEY_1_JWK, SYMMETRIC_KEY_1_JWK } from '../sampleKeys.js';

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
      const pemKey = new PemKey(PUBLIC_KEY_1);
      assert.strictEqual(pemKey.keyString, PUBLIC_KEY_1);
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
      const pemKey = new PemKey(PRIVATE_KEY_1);
      const keyLike = await pemKey.getKeyLike('RS256');
      assert.strictEqual(keyLike.type, 'private');
    });
    it('Public Key - RS256', async() => {
      const pemKey = new PemKey(PUBLIC_KEY_1);
      const keyLike = await pemKey.getKeyLike('RS256');
      assert.strictEqual(keyLike.type, 'public');
    });
    it('Public Key - ES256', async() => {
      const pemKey = new PemKey(PUBLIC_KEY_FASTLY_FANOUT_PEM);
      const keyLike = await pemKey.getKeyLike('ES256');
      assert.strictEqual(keyLike.type, 'public');
    });
  });
});
describe('JwkKey', () => {
  describe('constructor', () => {
    it('constructs with a JWK', () => {
      const jwkKey = new JwkKey(PUBLIC_KEY_FASTLY_FANOUT_JWK);
      assert.deepStrictEqual(jwkKey.jwk, PUBLIC_KEY_FASTLY_FANOUT_JWK);
    });
  });
  describe('getKeyLike', () => {
    it('Private Key - RS256', async() => {
      const jwkKey = new JwkKey(PRIVATE_KEY_1_JWK);
      const keyLike = await jwkKey.getSecretOrKeyLike();
      assert.ok(isKeyLike(keyLike));
      assert.strictEqual(keyLike.type, 'private');
    });
    it('Public Key - RS256', async() => {
      const jwkKey = new JwkKey(PUBLIC_KEY_1_JWK);
      const keyLike = await jwkKey.getSecretOrKeyLike();
      assert.ok(isKeyLike(keyLike));
      assert.strictEqual(keyLike.type, 'public');
    });
    it('Public Key - ES256', async() => {
      const jwkKey = new JwkKey(PUBLIC_KEY_FASTLY_FANOUT_JWK);
      const keyLike = await jwkKey.getSecretOrKeyLike();
      assert.ok(isKeyLike(keyLike));
      assert.strictEqual(keyLike.type, 'public');
    });
    it('Symmetric Key - HS256', async() => {
      const jwkKey = new JwkKey(SYMMETRIC_KEY_1_JWK);
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
    const loadedKey = loadKey(PRIVATE_KEY_1);
    assert.ok(!isSymmetricSecret(loadedKey));
  });
  it('says JwkKey is symmetric for symmetric key', () => {
    const loadedKey = loadKey(SYMMETRIC_KEY_1_JWK);
    assert.ok(isSymmetricSecret(loadedKey));
  })
  it('says JwkKey is not symmetric for non-\'secret\' key', () => {
    const loadedKey = loadKey(PRIVATE_KEY_1_JWK);
    assert.ok(!isSymmetricSecret(loadedKey));
  })
  it('says jose.KeyLike is symmetric for \'secret\' key', async () => {
    const loadedKey = await crypto.subtle.importKey('raw', textEncoder.encode(SYMMETRIC_KEY_1_JWK.k),
      { name: 'HMAC', hash: 'SHA-256', }, false, ['verify']);
    assert.ok(isSymmetricSecret(loadedKey));
  });
  it('says jose.KeyLike is not symmetric for non-\'secret\' key', async () => {
    const loadedKey = await crypto.subtle.importKey('jwk', PRIVATE_KEY_1_JWK,
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
    const key = 'base64:SGVsbG8=';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode('Hello'));
  });
  it('Loads string key that starts with base64-encoded hyphens as Uint8Array if it doesn\'t look like a PEM', () => {
    const key = 'base64:LS0tLS0tLS0tLQ==';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode('----------'));
  });
  it('Loads strings that start with PKCS#8 first line as PemKey', async () => {
    const loadedKey = loadKey(PRIVATE_KEY_1);
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads strings that start with SPKI first line as PemKey', async () => {
    const loadedKey = loadKey(PUBLIC_KEY_1);
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
    const loadedKey = loadKey(textEncoder.encode(PRIVATE_KEY_1));
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads jose.KeyLike object as itself', async () => {
    const publicKey = await jose.importSPKI(PUBLIC_KEY_1, 'RS256')
    const loadedKey = loadKey(publicKey);
    assert.ok(isKeyLike(loadedKey));
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads base64 string that encodes a PEM as PemKey', async () => {
    const key =
      'base64:LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowRE' +
      'FRY0RRZ0FFQ0tvNUExZWJ5RmNubVZWOFNFNU9uKzhHODFKeQpCalN2Y3J4NFZMZXRXQ2p1REFtcHBUbzN' +
      '4TS96ejc2M0NPVENnSGZwLzZsUGRDeVlqanFjK0dNN3N3PT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t';

    const loadedKey = loadKey(key);
    assert.ok(loadedKey instanceof PemKey);
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads JsonWebKey as JwkKey', async () => {
    const key = {
      'kty': 'RSA',
      'n': 'u1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0_IzW7yWR7QkrmBL7jTKEn5u-qKhbwKfBstIs-bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyehkd3qqGElvW_VDL5AaWTg0nLVkjRo9z-40RQzuVaE8AkAFmxZzow3x-VJYKdjykkJ0iT9wCS0DRTXu269V264Vf_3jvredZiKRkgwlL9xNAwxXFg0x_XFw005UWVRIkdgcKWTjpBP2dPwVZ4WWC-9aGVd-Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbcmw',
      'e': 'AQAB',
      'd': 'pOaNpLq2QrwGU9cKVNDa-nP83q7EN5LfmZempqyqyRWVoCJ2CD-xaqmNcNtev3ei0gwuVawz5fQKowOBJcp6MtLaPHgYOMjVlNeD77QAwnywnvilbNUM5-YIRD_vBezf5xudeEquI7xnTfqr3ZBzX43ztIjfyeQZrQAEf0I3zceZCq3h8HtR0fO4hF7-Z7Y8aEirlkHOPqHcGmg8bMQ_7HeX1iYry3_Vw3Smoj51DBh2B8aNpyQu7_aofzQwIXsjJBqx5lQ4nIqsIu1IP8iLG_-HMMRQ984KMUOBOnN_dzC1rz6gTjAcKjWIjX_hOU-TCZfHipJe2bDhpA_PsgNC8Q',
      'p': '8KNThCO2gsC2I9PQDM_8Cw0O983WCDY-oi-7JPiNAJwv5DYBqEZB1QYdj06YD16XlC_HAZMsMku1na2TN0driwenQQWzoev3g2S7gRDoS_FCJSI3jJ-kjgtaA7Qmzlgk1TxODN-G1H91HW7t0l7VnL27IWyYo2qRRK3jzxqUiPU',
      'q': 'x0oQs2reBQGMVZnApD1jeq7n4MvNLcPvt8b_eU9iUv6Y4Mj0Suo_AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDUAhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn__LiH1B3rXhcdyo3_vIttEk48RakUKClU8',
      'dp': 'zV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD_ISLDY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnKxt1Il2HgxOBvbhOT-9in1BzA-YJ99UzC85O0Qz06A-CmtHEy4aZ2kj5hHjE',
      'dq': 'mNS4-A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2-cwPLhPIzIuwytXywh2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfzet6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEs',
      'qi': 'JzNw0H9xSaEp12jIa1QSKL4nOZdMRZBB7JAIxU3rzvOhbM9QtmknkSkqhhaDkNLZicwRLNUeiqpxyJ4nA00KyoQK4C11-L9wnXY300SZBVg2xPwpLymTTq3H9Z4Whgj7KUSY9ilJI9RYZfQp3HZ_0bGBDjW8EEoyHzD5L8RfvB0',
      'ext': true,
      'alg': 'RS256',
      'use': 'sig'
    };
    const loadedKey = loadKey(key);
    assert.ok(loadedKey instanceof JwkKey);
  });
  it('Loads string encoding of JsonWebKey as JwkKey', async () => {
    const key = {
      'kty': 'RSA',
      'n': 'u1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0_IzW7yWR7QkrmBL7jTKEn5u-qKhbwKfBstIs-bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyehkd3qqGElvW_VDL5AaWTg0nLVkjRo9z-40RQzuVaE8AkAFmxZzow3x-VJYKdjykkJ0iT9wCS0DRTXu269V264Vf_3jvredZiKRkgwlL9xNAwxXFg0x_XFw005UWVRIkdgcKWTjpBP2dPwVZ4WWC-9aGVd-Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbcmw',
      'e': 'AQAB',
      'ext': true,
      'kid': 'cd60a7d6a720436c5719172',
      'alg': 'RS256',
      'use': 'sig'
    };
    const loadedKey = loadKey(JSON.stringify(key));
    assert.ok(loadedKey instanceof JwkKey);
  });
  it('Loads Uint8Array encoding of JsonWebKey as JwkKey', async () => {
    const key = {
      'kty': 'EC',
      'crv': 'P-256',
      'x': 'CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg',
      'y': '7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M'
    };
    const loadedKey = loadKey(textEncoder.encode(JSON.stringify(key)));
    assert.ok(loadedKey instanceof JwkKey);
  });
});
