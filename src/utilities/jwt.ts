import * as jose from 'jose';

const textEncoder = new TextEncoder();

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
export async function validateSig(token: string, key: string | Uint8Array | jose.KeyLike, iss?: string) {

    let verifyKey: Uint8Array | jose.KeyLike;
    if (typeof key === 'string') {
        if (key.indexOf('-----BEGIN PUBLIC KEY-----') === 0) {
            verifyKey = await jose.importSPKI(key, 'RS256');
        } else {
            verifyKey = textEncoder.encode(key);
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
