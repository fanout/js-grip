import { IAuth } from './IAuth.js';

// Bearer authentication class used for building auth headers containing a literal token.
export class Bearer implements IAuth {
    public token: string;

    constructor(token: string) {
        // Initialize with the specified literal token.
        this.token = token;
    }

    // Returns the auth header containing the Bearer token.
    buildHeader() {
        return `Bearer ${this.token}`;
    }
}
