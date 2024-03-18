import { encodeBytesToBase64String } from '../utilities/index.js';
import { type IAuth } from './IAuth.js';

export class Basic implements IAuth {
    private readonly _user: string;
    private readonly _pass: string;

    constructor(user: string, pass: string) {
        // Initialize with a username and password.
        this._user = user;
        this._pass = pass;
    }

    getUser() {
        return this._user;
    }

    getPass() {
        return this._pass;
    }

    // Returns the auth header containing the username and password
    // in Basic auth format.
    async buildHeader() {
        const data = `${this._user}:${this._pass}`;
        const textEncoder = new TextEncoder();
        const dataBase64 = encodeBytesToBase64String(textEncoder.encode(data));
        return `Basic ${dataBase64}`;
    }
}
