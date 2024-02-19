import jwt from 'jsonwebtoken';
const textEncoder = new TextEncoder();

import { IAuth } from './IAuth.js';

// JWT authentication class used for building auth headers containing
// JSON web token information in the form of a claim and corresponding key.
export class Jwt implements IAuth {
    public claim?: object;
    public key: Uint8Array;

    constructor(claim: object, key: Uint8Array | string) {
        // Initialize with the specified claim and key.
        this.claim = claim;
        this.key = key instanceof Uint8Array ? key : textEncoder.encode(key);
    }

    // Returns the auth header containing the JWT token in Bearer format.
    buildHeader() {
        const token = jwt.sign(this.claim as object, this.key as string | Buffer, { expiresIn: '10m' });
        return `Bearer ${token}`;
    }
}
