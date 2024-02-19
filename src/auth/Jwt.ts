import { Buffer } from 'buffer';
import jwt from 'jsonwebtoken';

import { IAuth } from './IAuth.js';

// JWT authentication class used for building auth headers containing
// JSON web token information in the form of a claim and corresponding key.
export class Jwt implements IAuth {
    public claim?: object;
    public key?: Buffer;

    constructor(claim: object, key: Buffer | string) {
        // Initialize with the specified claim and key.
        this.claim = claim;
        this.key = key instanceof Buffer ? key : Buffer.from(String(key), 'utf8');
    }

    // Returns the auth header containing the JWT token in Bearer format.
    buildHeader() {
        const token = jwt.sign(this.claim as object, this.key as string | Buffer, { expiresIn: '10m' });
        return `Bearer ${token}`;
    }
}
