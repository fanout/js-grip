import { IAuth } from './IAuth.js';
import { encodeBytesToBase64String } from '../utilities/index.js';

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
        const textEncoder = new TextEncoder();
        const dataBase64 = encodeBytesToBase64String(textEncoder.encode(data));
        return `Basic ${dataBase64}`;
    }
}
