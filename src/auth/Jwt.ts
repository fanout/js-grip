import * as jose from 'jose';
const textEncoder = new TextEncoder();

import { IAuth } from './IAuth.js';

// JWT authentication class used for building auth headers containing
// JSON web token information in the form of a claim and corresponding key.
export class Jwt implements IAuth {
    public claim?: Record<string, string>;
    public key: Uint8Array;

    constructor(claim: Record<string, string>, key: Uint8Array | string) {
        // Initialize with the specified claim and key.
        this.claim = claim;
        this.key = key instanceof Uint8Array ? key : textEncoder.encode(key);
    }

    // Returns the auth header containing the JWT token in Bearer format.
    async buildHeader() {

        const signJwt = new jose.SignJWT(this.claim)
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('10m');
        const token = await signJwt.sign(this.key);

        return `Bearer ${token}`;
    }
}
