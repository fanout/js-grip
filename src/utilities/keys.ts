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

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function keyStringToKeyLike(keyString: string) {
  if (keyString.indexOf('-----BEGIN PUBLIC KEY-----') === 0) {
    return jose.importSPKI(keyString, 'RS256');
  }
  if (keyString.indexOf('-----BEGIN PRIVATE KEY-----') === 0) {
    return jose.importPKCS8(keyString, 'RS256');
  }
  return false;
}

function jsonWebKeyToKeyLike(obj: unknown) {
  let jwk = obj as jose.JWK;
  return new Promise<jose.KeyLike>(async resolve => {
    const result = await jose.importJWK(jwk);
    if (result instanceof Uint8Array) {
      throw new Error('Unexpected');
    }
    resolve(result);
  });
}

function isJsonWebKey(obj: any): obj is JsonWebKey {
  return obj.kty != null;
}

export function loadKey(key: string | JsonWebKey | Uint8Array | jose.KeyLike) {

  let result: string | JsonWebKey | Uint8Array | jose.KeyLike | Promise<jose.KeyLike> = key;

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
      const keyLikeResult = keyStringToKeyLike(keyString);
      if (keyLikeResult !== false) {
        result = keyLikeResult;
      }
    }
  }

  if (typeof result === 'string') {
    const keyLikeResult = keyStringToKeyLike(result);
    if (keyLikeResult !== false) {
      result = keyLikeResult;
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
        result = jsonWebKeyToKeyLike(jsonObj);
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
        result = jsonWebKeyToKeyLike(jsonObj);
      }
    }
  }

  if (isJsonWebKey(result)) {
    result = jsonWebKeyToKeyLike(result);
  }

  if (typeof result === 'string') {
    result = textEncoder.encode(result);
  }

  return result;

}
