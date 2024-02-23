import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';
import { loadKey } from '../../../src/index.js';
import { PRIVATE_KEY_1, PUBLIC_KEY_1 } from '../sampleKeys.js';

const textEncoder = new TextEncoder();

describe('loadKey', () => {
  it('Loads string key as Uint8Array bytes', () => {
    const key = 'asfasjdkfl;a';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode(key));
  });
  it("Loads string key that starts with hyphens as Uint8Array bytes of itself if it doesn't look like a PEM", () => {
    const key = '----------';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode(key));
  });
  it('Loads strings that start with base64: as a base64-encoded Uint8Array', () => {
    const key = 'base64:SGVsbG8=';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode('Hello'));
  });
  it("Loads string key that starts with base64-encoded hyphens as Uint8Array if it doesn't look like a PEM", () => {
    const key = 'base64:LS0tLS0tLS0tLQ==';
    const loadedKey = loadKey(key);
    assert.deepStrictEqual(loadedKey, textEncoder.encode('----------'));
  });
  it('Loads strings that start with PKCS#8 first line as Promise to jose.KeyLike', async () => {
    const loadedKey = await loadKey(PRIVATE_KEY_1);
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads strings that start with SPKI first line as Promise to jose.KeyLike', async () => {
    const loadedKey = await loadKey(PUBLIC_KEY_1);
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
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
  it('Loads Uint8Array that starts with PKCS#8 first line as Promise to jose.KeyLike', async () => {
    const loadedKey = await loadKey(textEncoder.encode(PRIVATE_KEY_1));
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads jose.KeyLike object as itself', async () => {
    const publicKey = await jose.importSPKI(PUBLIC_KEY_1, 'RS256')
    const loadedKey = loadKey(publicKey);
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.ok(!(loadedKey instanceof Promise));
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads base64 string that encodes a PEM as Promise to jose.KeyLike', async () => {
    const key =
      "base64:LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowRE" +
      "FRY0RRZ0FFQ0tvNUExZWJ5RmNubVZWOFNFNU9uKzhHODFKeQpCalN2Y3J4NFZMZXRXQ2p1REFtcHBUbzN" +
      "4TS96ejc2M0NPVENnSGZwLzZsUGRDeVlqanFjK0dNN3N3PT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t";

    const loadedKey = await loadKey(key);
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads JsonWebKey as jose.KeyLike', async () => {
    const key = {
      "kty": "RSA",
      "n": "u1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0_IzW7yWR7QkrmBL7jTKEn5u-qKhbwKfBstIs-bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyehkd3qqGElvW_VDL5AaWTg0nLVkjRo9z-40RQzuVaE8AkAFmxZzow3x-VJYKdjykkJ0iT9wCS0DRTXu269V264Vf_3jvredZiKRkgwlL9xNAwxXFg0x_XFw005UWVRIkdgcKWTjpBP2dPwVZ4WWC-9aGVd-Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbcmw",
      "e": "AQAB",
      "d": "pOaNpLq2QrwGU9cKVNDa-nP83q7EN5LfmZempqyqyRWVoCJ2CD-xaqmNcNtev3ei0gwuVawz5fQKowOBJcp6MtLaPHgYOMjVlNeD77QAwnywnvilbNUM5-YIRD_vBezf5xudeEquI7xnTfqr3ZBzX43ztIjfyeQZrQAEf0I3zceZCq3h8HtR0fO4hF7-Z7Y8aEirlkHOPqHcGmg8bMQ_7HeX1iYry3_Vw3Smoj51DBh2B8aNpyQu7_aofzQwIXsjJBqx5lQ4nIqsIu1IP8iLG_-HMMRQ984KMUOBOnN_dzC1rz6gTjAcKjWIjX_hOU-TCZfHipJe2bDhpA_PsgNC8Q",
      "p": "8KNThCO2gsC2I9PQDM_8Cw0O983WCDY-oi-7JPiNAJwv5DYBqEZB1QYdj06YD16XlC_HAZMsMku1na2TN0driwenQQWzoev3g2S7gRDoS_FCJSI3jJ-kjgtaA7Qmzlgk1TxODN-G1H91HW7t0l7VnL27IWyYo2qRRK3jzxqUiPU",
      "q": "x0oQs2reBQGMVZnApD1jeq7n4MvNLcPvt8b_eU9iUv6Y4Mj0Suo_AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDUAhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn__LiH1B3rXhcdyo3_vIttEk48RakUKClU8",
      "dp": "zV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD_ISLDY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnKxt1Il2HgxOBvbhOT-9in1BzA-YJ99UzC85O0Qz06A-CmtHEy4aZ2kj5hHjE",
      "dq": "mNS4-A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2-cwPLhPIzIuwytXywh2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfzet6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEs",
      "qi": "JzNw0H9xSaEp12jIa1QSKL4nOZdMRZBB7JAIxU3rzvOhbM9QtmknkSkqhhaDkNLZicwRLNUeiqpxyJ4nA00KyoQK4C11-L9wnXY300SZBVg2xPwpLymTTq3H9Z4Whgj7KUSY9ilJI9RYZfQp3HZ_0bGBDjW8EEoyHzD5L8RfvB0",
      "ext": true,
      "alg": "RS256",
      "use": "sig"
    };
    const loadedKey = await loadKey(key);
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.strictEqual(loadedKey.type, 'private');
  });
  it('Loads string encoding of JsonWebKey as jose.KeyLike', async () => {
    const key = {
      "kty": "RSA",
      "n": "u1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0_IzW7yWR7QkrmBL7jTKEn5u-qKhbwKfBstIs-bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyehkd3qqGElvW_VDL5AaWTg0nLVkjRo9z-40RQzuVaE8AkAFmxZzow3x-VJYKdjykkJ0iT9wCS0DRTXu269V264Vf_3jvredZiKRkgwlL9xNAwxXFg0x_XFw005UWVRIkdgcKWTjpBP2dPwVZ4WWC-9aGVd-Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbcmw",
      "e": "AQAB",
      "ext": true,
      "kid": "cd60a7d6a720436c5719172",
      "alg": "RS256",
      "use": "sig"
    };
    const loadedKey = await loadKey(JSON.stringify(key));
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.strictEqual(loadedKey.type, 'public');
  });
  it('Loads Uint8Array encoding of JsonWebKey as jose.KeyLike', async () => {
    const key = {
      "kty": "EC",
      "crv": "P-256",
      "x": "CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg",
      "y": "7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M"
    };
    const loadedKey = await loadKey(textEncoder.encode(JSON.stringify(key)));
    assert.ok(loadedKey != null);
    assert.ok(!(loadedKey instanceof Uint8Array));
    assert.strictEqual(loadedKey.type, 'public');
  });
});