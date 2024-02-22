import * as jose from 'jose';
import type { IAuth } from './IAuth.js';

const textEncoder = new TextEncoder();

// JWT authentication class used for building auth headers containing
// JSON web token information in the form of a claim and corresponding key.
export class Jwt implements IAuth {
    private readonly _claim: Record<string, string>;
    private readonly _key: Uint8Array | jose.KeyLike | Promise<jose.KeyLike>;

    constructor(claim: Record<string, string>, key: string | Uint8Array | jose.KeyLike) {
        // Initialize with the specified claim and key.
        this._claim = claim;
        if (typeof key === 'string') {
            if (key.indexOf('-----BEGIN PUBLIC KEY-----') === 0) {
                this._key = jose.importSPKI(key, 'RS256');
            } else {
                this._key = textEncoder.encode(key);
            }
        } else {
            this._key = key;
        }
    }

    // Returns the auth header containing the JWT token in Bearer format.
    async buildHeader() {

        const signJwt = new jose.SignJWT(this._claim)
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('10m');
        const token = await signJwt.sign(await this._key);

        return `Bearer ${token}`;
    }

    getClaim() {
        return this._claim;
    }

    async getKey() {
        return this._key;
    }
}
