import * as jose from 'jose';
import { decodeBytesFromBase64String } from './base64.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class PemKey {
  keyString: string;
  type: 'public' | 'private';
  constructor(keyString: string) {
    if (keyString.startsWith('-----BEGIN PUBLIC KEY-----')) {
      this.type = 'public';
    } else if (
      keyString.startsWith('-----BEGIN PRIVATE KEY-----')
    ) {
      this.type = 'private';
    } else {
      throw new TypeError('Attempt to construct PemKey with string that is evidently not a PEM');
    }
    this.keyString = keyString;
  }

  async getKeyLike(alg: string) {
    if (this.keyString.indexOf('-----BEGIN PRIVATE KEY-----') === 0) {
      return jose.importPKCS8(this.keyString, alg);
    }
    if (this.keyString.indexOf('-----BEGIN PUBLIC KEY-----') === 0) {
      return jose.importSPKI(this.keyString, alg);
    }
    throw new Error('PEM type not supported.');
  }
}

export class JwkKey {
  jwk: JsonWebKey
  constructor(jwk: JsonWebKey) {
    this.jwk = jwk;
  }

  async getSecretOrKeyLike(alg?: string) {
    return jose.importJWK(this.jwk as jose.JWK, alg);
  }
}

export function isSymmetricSecret(key: Uint8Array | jose.KeyLike | PemKey | JwkKey) {
  if (key instanceof Uint8Array) {
    return true;
  } else if (key instanceof PemKey) {
    return false;
  } else if (key instanceof JwkKey) {
    return key.jwk.kty === 'oct';
  }

  return key.type === 'secret';
}

function isPem(keyString: string) {
  return (
    keyString.startsWith('-----BEGIN PUBLIC KEY-----') ||
    keyString.startsWith('-----BEGIN PRIVATE KEY-----')
  );
}

function isJsonWebKey(obj: any): obj is JsonWebKey {
  return obj.kty != null;
}

export function loadKey(key: string | JsonWebKey | Uint8Array | jose.KeyLike): Uint8Array | jose.KeyLike | PemKey | JwkKey {

  let result: string | JsonWebKey | Uint8Array | jose.KeyLike | PemKey | JwkKey = key;

  if (typeof result === 'string' && result.startsWith('base64:')) {
    result = result.slice(7);
    result = decodeBytesFromBase64String(result);
  }

  // If the array starts with five hyphens,
  // it might be a PEM-encoded SPKI or PKCS#8 key
  if (result instanceof Uint8Array && result.at(0) === 45 &&
    result.at(1) === 45 &&
    result.at(2) === 45 &&
    result.at(3) === 45 &&
    result.at(4) === 45
  ) {
    let keyString: string | null = null;
    try {
      keyString = textDecoder.decode(result);
    } catch {
    }

    if (keyString != null) {
      if (isPem(keyString)) {
        result = new PemKey(keyString);
      }
    }
  }

  if (typeof result === 'string') {
    if (isPem(result)) {
      result = new PemKey(result);
    }
  }

  // '{'
  if (result instanceof Uint8Array && result.at(0) === 123) {
    let keyString: string | null = null;
    try {
      keyString = textDecoder.decode(result);
    } catch {
    }

    if (keyString != null) {
      let jsonObj: unknown = null;
      try {
        jsonObj = JSON.parse(keyString);
      } catch {
      }

      if (jsonObj != null && isJsonWebKey(jsonObj)) {
        result = new JwkKey(jsonObj);
      }
    }
  }

  if (typeof result === 'string') {
    if (result.startsWith('{')) {
      let jsonObj: unknown = null;
      try {
        jsonObj = JSON.parse(result);
      } catch {
      }

      if (jsonObj != null && isJsonWebKey(jsonObj)) {
        result = new JwkKey(jsonObj);
      }
    }
  }

  if (isJsonWebKey(result)) {
    result = new JwkKey(result);
  }

  if (typeof result === 'string') {
    result = textEncoder.encode(result);
  }

  return result;

}
