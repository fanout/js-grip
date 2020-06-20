import { Buffer } from 'buffer';
import { encode } from 'jwt-simple';

import Base from "./Base";

// JWT authentication class used for building auth headers containing
// JSON web token information in either the form of a claim and
// corresponding key, or the literal token itself.
export default class Jwt extends Base {
    public token?: string;
    public claim?: object;
    public key?: Buffer;

    constructor(token: string);
    constructor(claim: object, key: Buffer | string);
    constructor(...args: any[]) {
        super();
        // Initialize with the specified claim and key. If only one parameter
        // was provided then treat it as the literal token.
        if (args.length === 1) {
            this.token = args[0] as string;
            this.claim = undefined;
            this.key = undefined;
        } else {
            this.token = undefined;
            this.claim = args[0] as object;
            this.key = args[1] instanceof Buffer ? args[1] : Buffer.from( String(args[1]), "utf8" );
        }
    }

    // Returns the auth header containing the JWT token in Bearer format.
    buildHeader() {
        let token;
        if (this.token != null) {
            token = this.token;
        } else {
            const claim =
                this.claim != null && "exp" in this.claim ?
                    this.claim :
                    Object.assign({}, this.claim, {
                        exp: Math.floor(new Date().getTime() / 1000) + 600
                    });
            // @ts-ignore
            token = encode(claim, this.key);
        }
        return "Bearer " + token;
    }
}
