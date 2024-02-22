import type { IAuth } from './IAuth.js';

// Bearer authentication class used for building auth headers containing a literal token.
export class Bearer implements IAuth {
    private readonly _token: string;

    constructor(token: string) {
        // Initialize with the specified literal token.
        this._token = token;
    }

    getToken() {
        return this._token;
    }

    // Returns the auth header containing the Bearer token.
    async buildHeader() {
        return `Bearer ${this._token}`;
    }
}
