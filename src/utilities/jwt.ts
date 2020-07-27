import * as jwt from "jwt-simple";
import { toBuffer } from "./buffer";

// Validate the specified JWT token and key. This method is used to validate
// the GRIP-SIG header coming from GRIP proxies such as Pushpin or Fanout.io.
// Note that the token expiration is also verified.
export function validateSig(token: string, key: any) {
    const keyBuffer = toBuffer(key);

    let claim;
    try {
        // HACK: jwt-simple's d.ts says decode takes a string, but
        // it works fine with buffer.
        claim = jwt.decode(token, keyBuffer as unknown as string);
    } catch(e) {
        return false;
    }

    if (!('exp' in claim)) {
        return false;
    }

    const { exp } = claim;
    return new Date().getTime() / 1000 <= exp;
}
