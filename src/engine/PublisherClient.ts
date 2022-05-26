import { Buffer } from 'buffer';
import 'isomorphic-fetch';
import HttpAgent, { HttpsAgent } from 'agentkeepalive';

import * as Auth from '../auth/index';
import { IItem, IItemExport, PublishException } from '../data';

interface IReqHeaders {
    [name: string]: string;
}
interface IReqParams {
    method: string;
    headers: IReqHeaders;
    body: string;
    agent?: HttpAgent;
}
interface IContext {
    statusCode: number;
    headers?: object;
    httpBody?: any;
}
interface FetchResponse {
    status: number;
    headers: object;
    httpBody?: any;
    text: () => Promise<string>;
}
type Transport = (url: string, reqParams: IReqParams) => Promise<FetchResponse>;

declare global {
    interface Object {
        hasOwnProperty<K extends PropertyKey>(key: K): this is Record<K, unknown>;
    }
}

// The PublisherClient class allows consumers to publish to an endpoint of
// their choice. The consumer wraps a Format class instance in an Item class
// instance and passes that to the publish method.
export class PublisherClient {
    public uri?: string;
    public auth?: Auth.IAuth;
    public httpKeepAliveAgent?: HttpAgent = new HttpAgent();
    public httpsKeepAliveAgent?: HttpsAgent = new HttpsAgent();

    constructor(uri: string) {
        // Initialize this class with a URL representing the publishing endpoint.
        this.uri = uri.replace(/\/$/, '');
    }

    // Call this method and pass a username and password to use basic
    // authentication with the configured endpoint.
    setAuthBasic(username: string, password: string) {
        this.auth = new Auth.Basic(username, password);
    }

    // Call this method and pass a claim and key to use JWT authentication
    // with the configured endpoint.
    setAuthJwt(token: string): void;
    setAuthJwt(claim: object, key?: Buffer | string): void;
    setAuthJwt(...args: [any]): void {
        this.auth = new Auth.Jwt(...args);
    }

    // The publish method for publishing the specified item to the specified
    // channel on the configured endpoint.
    async publish(channel: string, item: IItem): Promise<void> {
        const i = item.export();
        i.channel = channel;
        const authHeader = this.auth != null ? this.auth.buildHeader() : null;
        await this._startPubCall(this.uri, authHeader, [i]);
    }

    // An internal method for starting the work required for publishing
    // a message. Accepts the URI endpoint, authorization header, items
    // object, and optional callback as parameters.
    async _startPubCall(uri: string | undefined, authHeader: string | null, items: IItemExport[]) {
        // Prepare Request Body
        const content = JSON.stringify({ items });
        // Build HTTP headers
        const headers: IReqHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': String(Buffer.byteLength(content, 'utf8')),
        };
        if (authHeader != null) {
            headers['Authorization'] = authHeader;
        }
        // Build HTTP request parameters
        const publishUri = uri + '/publish/';
        const parsed = new URL(publishUri);
        const reqParams: IReqParams = {
            method: 'POST',
            headers: headers,
            body: content,
            agent: undefined,
        };
        switch (parsed.protocol) {
            case 'http:':
                reqParams.agent = this.httpKeepAliveAgent;
                break;
            case 'https:':
                reqParams.agent = this.httpsKeepAliveAgent;
                break;
            default:
                await new Promise((resolve) => setTimeout(resolve, 0));
                throw new PublishException('Bad URI', { statusCode: -2 });
        }
        await this._performHttpRequest(fetch, publishUri, reqParams);
    }

    // An internal method for performing the HTTP request for publishing
    // a message with the specified parameters.
    async _performHttpRequest(transport: Transport, uri: string, reqParams: IReqParams) {
        let res = null;

        try {
            res = await transport(uri, reqParams);
        } catch (err) {
            throw new PublishException(err != null && typeof err === 'object' && err.hasOwnProperty('message') && typeof err.message === 'string' ? err.message : String(err), { statusCode: -1 });
        }

        const context: IContext = {
            statusCode: res.status,
            headers: res.headers,
        };
        let mode;
        let data;
        try {
            mode = 'end';
            data = await res.text();
        } catch (err) {
            mode = 'close';
            data = err;
        }
        this._finishHttpRequest(mode, data, context);
    }

    // An internal method for finishing the HTTP request for publishing
    // a message.
    _finishHttpRequest(mode: string, httpData: any, context: IContext) {
        context.httpBody = httpData;
        if (mode === 'end') {
            if (context.statusCode < 200 || context.statusCode >= 300) {
                throw new PublishException(JSON.stringify(context.httpBody), context);
            }
        } else if (mode === 'close') {
            throw new PublishException('Connection closed unexpectedly', context);
        }
    }
}
