import * as jose from 'jose';
import { isSymmetricSecret, loadKey, JwkKey, PemKey } from './keys.js';

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
export async function validateSig(token: string, key: string | Uint8Array | jose.KeyLike | PemKey | JwkKey, iss?: string) {

    if (typeof key === 'string' || key instanceof Uint8Array) {
        key = loadKey(key);
    }

    let verifyKey: Uint8Array | jose.KeyLike;

    if (key instanceof JwkKey || key instanceof PemKey) {
        let header;
        try {
            header = jose.decodeProtectedHeader(token);
        } catch {
            header = {};
        }
        const alg = header.alg ?? (isSymmetricSecret(key) ? 'HS256' : 'RS256');
        if (key instanceof JwkKey) {
            verifyKey = await key.getSecretOrKeyLike(alg);
        } else {
            verifyKey = await key.getKeyLike(alg);
        }
    } else {
        verifyKey = key;
    }

    let claim: jose.JWTVerifyResult;
    try {
        claim = await jose.jwtVerify(token, verifyKey);
    } catch (e) {
        return false;
    }

    if (iss != null) {
        if (claim.payload.iss !== iss) {
            return false;
        }
    }

    return true;
}
