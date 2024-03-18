import * as jose from 'jose';
import { isSymmetricSecret, JwkKey, PemKey } from '../utilities/index.js';
import { type IAuth } from './IAuth.js';

// JWT authentication class used for building auth headers containing
// JSON web token information in the form of a claim and corresponding key.
export class Jwt implements IAuth {
    private readonly _claim: Record<string, string>;
    private readonly _key: Uint8Array | jose.KeyLike | PemKey | JwkKey;
    private readonly _alg?: string;

    constructor(claim: Record<string, string>, key: Uint8Array | jose.KeyLike | PemKey | JwkKey, alg?: string) {
        // Initialize with the specified claim and key.
        this._claim = claim;
        this._key = key;
        this._alg = alg;
    }

    // Returns the auth header containing the JWT token in Bearer format.
    async buildHeader() {

        const key = this._key;
        let alg = this._alg ?? (isSymmetricSecret(key) ? 'HS256' : 'RS256');

        let signKey: Uint8Array | jose.KeyLike;
        if (key instanceof JwkKey) {
            signKey = await key.getSecretOrKeyLike(alg);
        } else if (key instanceof PemKey) {
            signKey = await key.getKeyLike(alg);
        } else {
            signKey = key;
        }

        const signJwt = new jose.SignJWT(this._claim)
          .setProtectedHeader({ alg })
          .setExpirationTime('10m');
        const token = await signJwt.sign(signKey);

        return `Bearer ${token}`;
    }

    getClaim() {
        return this._claim;
    }

    getKey() {
        return this._key;
    }
}
