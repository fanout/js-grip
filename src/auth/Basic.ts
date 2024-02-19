import { Buffer } from 'node:buffer';

import { IAuth } from './IAuth.js';

export class Basic implements IAuth {
    public user: string;
    public pass: string;

    constructor(user: string, pass: string) {
        // Initialize with a username and password.
        this.user = user;
        this.pass = pass;
    }

    // Returns the auth header containing the username and password
    // in Basic auth format.
    buildHeader(): string {
        const data = `${this.user}:${this.pass}`;
        const dataBase64 = Buffer.from(data).toString('base64');
        return `Basic ${dataBase64}`;
    }
}
