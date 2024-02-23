import * as jose from 'jose';
import { loadKey } from './keys.js';

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
export async function validateSig(token: string, key: string | Uint8Array | jose.KeyLike, iss?: string) {
    const verifyKey = await loadKey(key);

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
