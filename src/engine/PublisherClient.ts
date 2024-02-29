import * as jose from 'jose';
import * as Auth from '../auth/index.js';
import { isSymmetricSecret, loadKey, JwkKey, PemKey } from '../utilities/index.js';
import { IItem, PublishException } from '../data/index.js';
import type { IGripConfig } from './IGripConfig.js';
import type { IPublisherClient } from './IPublisherClient.js';

export type VerifyComponents = {
    verifyIss?: string;
    verifyKey?: Uint8Array | jose.KeyLike | PemKey | JwkKey;
}

export type PublisherClientOptions = {
    fetch?: typeof fetch,
};

const textEncoder = new TextEncoder();

// The PublisherClient class allows consumers to publish to an endpoint of
// their choice. The consumer wraps a Format class instance in an Item class
// instance and passes that to the publish method.
export class PublisherClient implements IPublisherClient {
    public publishUri: string;
    public _auth?: Auth.IAuth;
    private _verifyComponents?: VerifyComponents;
    public options: PublisherClientOptions;

    constructor(gripConfig: IGripConfig, options?: PublisherClientOptions) {
        let { control_uri: controlUri, control_iss: iss, user, pass, key: keyValue, verify_key: verifyKeyValue, verify_iss: verifyIss } = gripConfig;

        const url = new URL(controlUri);
        if (!url.pathname.endsWith('/')) {
            // To avoid breaking previous implementation, if the URL does
            // not end in a slash then we add one.
            // e.g. if URI is 'https://www.example.com/foo' then the
            // publishing URI is 'https://www.example.com/foo/publish'
            url.pathname += '/';
        }
        url.pathname += 'publish/';
        this.publishUri = String(url);

        if (iss != null) {
            const key = keyValue != null ? loadKey(keyValue) : new Uint8Array();
            this._auth = new Auth.Jwt({ iss }, key);

            // For backwards-compatibility reasons, if JWT authorization is used with a
            // symmetric secret and if `verify_key` is not provided, then `key` will also
            // be used as the `verify_key` value as well.
            if (isSymmetricSecret(key) && verifyKeyValue == null) {
                verifyKeyValue = keyValue;
            }
        } else if (typeof keyValue === 'string') {
            this._auth = new Auth.Bearer(keyValue);
        } else if (user != null && pass != null) {
            this._auth = new Auth.Basic(user, pass);
        }

        if (verifyIss != null || verifyKeyValue != null) {
            const verifyKey = verifyKeyValue != null ? loadKey(verifyKeyValue) : undefined;
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

    getVerifyKey() {
        return this._verifyComponents?.verifyKey;
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
        const headers: HeadersInit = {
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
            res = await (this.options.fetch ?? fetch)(this.publishUri, init);
        } catch (err) {
            throw new PublishException(err instanceof Error ? err.message : String(err), { statusCode: -1 });
        }

        let mode: 'end' | 'close';
        let data;
        try {
            mode = 'end';
            data = await res.text();
        } catch (err) {
            mode = 'close';
            data = err;
        }

        const context = {
            statusCode: res.status,
            headers: res.headers,
            httpBody: data,
        }

        if (mode === 'end') {
            if (context.statusCode < 200 || context.statusCode >= 300) {
                throw new PublishException(JSON.stringify(context.httpBody), context);
            }
        } else if (mode === 'close') {
            throw new PublishException('Connection closed unexpectedly', context);
        }
    }
}
