import * as jwt from 'jsonwebtoken';

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
export function validateSig(token: string, key: string | Buffer) {
    let claim;
    try {
        claim = jwt.verify(token, key);
    } catch (e) {
        return false;
    }

    if (claim == null) {
        return false;
    }

    return true;
}
