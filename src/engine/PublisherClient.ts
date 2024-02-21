import * as jose from 'jose';

import * as Auth from '../auth/index.js';
import { IItem, PublishException } from '../data/index.js';
import { IGripConfig } from './IGripConfig.js';
import { IPublisherClient } from './IPublisherClient.js';

export interface IReqHeaders {
    [name: string]: string;
}
interface IContext {
    statusCode: number;
    headers?: object;
    httpBody?: any;
}

export type VerifyComponents = {
    verifyIss?: string;
    verifyKey?: Uint8Array | jose.KeyLike | Promise<jose.KeyLike>;
}

export type PublisherClientOptions = {
    fetch?: typeof fetch,
};

const textEncoder = new TextEncoder();

// The PublisherClient class allows consumers to publish to an endpoint of
// their choice. The consumer wraps a Format class instance in an Item class
// instance and passes that to the publish method.
export class PublisherClient implements IPublisherClient {
    public _auth?: Auth.IAuth;
    public publishUri: string;
    private _verifyComponents?: VerifyComponents;
    public options: PublisherClientOptions;

    constructor(gripConfig: IGripConfig, options?: PublisherClientOptions) {
        let { control_uri: controlUri, control_iss: iss, user, pass, key, verify_key: verifyKeyValue, verify_iss: verifyIss } = gripConfig;

        const url = new URL(controlUri);
        if (!url.pathname.endsWith('/')) {
            // To avoid breaking previous implementation, if the URL does
            // not end in a slash then we add one.
            // e.g. if URI is 'https://www.example.com/foo' then the
            // publishing URI is 'https://www.example.com/foo/publish'
            url.pathname += '/';
        }
        this.publishUri = String(new URL('./publish/', url));

        let auth: Auth.IAuth | undefined = undefined;
        if (iss != null) {
            auth = new Auth.Jwt({iss}, key ?? '');
        } else if (typeof key === 'string') {
            auth = new Auth.Bearer(key);
        } else if (user != null && pass != null) {
            auth = new Auth.Basic(user, pass);
        }
        if (auth != null) {
            this._auth = auth;
        }

        if (verifyIss != null || verifyKeyValue != null) {
            let verifyKey: Uint8Array | jose.KeyLike | Promise<jose.KeyLike> | undefined;
            if (typeof verifyKeyValue === 'string') {
                if (verifyKeyValue.indexOf('-----BEGIN PUBLIC KEY-----') === 0) {
                    verifyKey = jose.importSPKI(verifyKeyValue, 'RS256');
                } else {
                    verifyKey = textEncoder.encode(verifyKeyValue);
                }
            } else {
                verifyKey = verifyKeyValue;
            }
            this._verifyComponents = {
                verifyIss,
                verifyKey,
            };
        }

        this.options = options ?? {};
    }

    getAuth() {
        return this._auth;
    }

    getVerifyIss() {
        return this._verifyComponents?.verifyIss;
    }

    async getVerifyKey() {
        return this._verifyComponents?.verifyKey ?? this._auth?.getVerifyKey?.();
    }

    // The publish method for publishing the specified item to the specified
    // channel on the configured endpoint.
    async publish(channel: string, item: IItem): Promise<void> {
        const i = item.export();
        i.channel = channel;
        const authHeader = this._auth != null ? await this._auth.buildHeader() : null;
        const items = [i];
        // Prepare Request Body
        const content = JSON.stringify({ items });
        // Build HTTP headers
        const headers: IReqHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': String(textEncoder.encode(content).length),
        };
        if (authHeader != null) {
            headers['Authorization'] = authHeader;
        }

        const init: RequestInit = {
            method: 'POST',
            headers,
            body: content,
        };

        let res;
        try {
            res = await (this.options.fetch ?? fetch)(String(this.publishUri), init);
        } catch (err) {
            throw new PublishException(err instanceof Error ? err.message : String(err), { statusCode: -1 });
        }

        const context: IContext = {
            statusCode: res.status,
            headers: res.headers,
        };
        let mode: 'end' | 'close';
        let data;
        try {
            mode = 'end';
            data = await res.text();
        } catch (err) {
            mode = 'close';
            data = err;
        }

        context.httpBody = data;

        if (mode === 'end') {
            if (context.statusCode < 200 || context.statusCode >= 300) {
                throw new PublishException(JSON.stringify(context.httpBody), context);
            }
        } else if (mode === 'close') {
            throw new PublishException('Connection closed unexpectedly', context);
        }
    }
}
