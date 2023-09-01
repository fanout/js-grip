import { Buffer } from 'buffer';

import * as Auth from '../auth/index';
import { IItem, IItemExport, PublishException } from '../data';

import { IPublisherTransport } from "./IPublisherTransport";
export interface IReqHeaders {
    [name: string]: string;
}
interface IContext {
    statusCode: number;
    headers?: object;
    httpBody?: any;
}

declare global {
    interface Object {
        hasOwnProperty<K extends PropertyKey>(key: K): this is Record<K, unknown>;
    }
}

// The PublisherClient class allows consumers to publish to an endpoint of
// their choice. The consumer wraps a Format class instance in an Item class
// instance and passes that to the publish method.
export class PublisherClient {
    public transport: IPublisherTransport;
    public auth?: Auth.IAuth;

    constructor(transport: IPublisherTransport) {
        this.transport = transport;
    }

    // Call this method and pass a username and password to use basic
    // authentication with the configured endpoint.
    setAuthBasic(username: string, password: string) {
        this.auth = new Auth.Basic(username, password);
    }

    // Call this method and pass a claim and key to use JWT authentication
    // with the configured endpoint.
    setAuthJwt(claim: object, key: Buffer | string): void {
        this.auth = new Auth.Jwt(claim, key);
    }

    // Call this method and pass a token use Bearer authentication
    // with the configured endpoint.
    setAuthBearer(token: string): void {
        this.auth = new Auth.Bearer(token);
    }

    // The publish method for publishing the specified item to the specified
    // channel on the configured endpoint.
    async publish(channel: string, item: IItem): Promise<void> {
        const i = item.export();
        i.channel = channel;
        const authHeader = this.auth != null ? this.auth.buildHeader() : null;
        await this._startPubCall(authHeader, [i]);
    }

    // An internal method for starting the work required for publishing
    // a message. Accepts the URI endpoint, authorization header, items
    // object, and optional callback as parameters.
    async _startPubCall(authHeader: string | null, items: IItemExport[]) {
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
        await this._performHttpRequest(headers, content);
    }

    // An internal method for performing the HTTP request for publishing
    // a message with the specified parameters.
    async _performHttpRequest(headers: IReqHeaders, content: string) {
        let res = null;

        try {
            res = await this.transport.publish(headers, content);
        } catch (err) {
            throw new PublishException(err != null && typeof err === 'object' && Object.prototype.hasOwnProperty.call(err, 'message') && typeof err.message === 'string' ? err.message : String(err), { statusCode: -1 });
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
