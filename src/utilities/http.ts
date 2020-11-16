import * as querystring from 'querystring';
import { IncomingMessage } from "http";

import { encodeCString, escapeQuotes, isString } from './string';
import debug from "./debug";

export function createKeepAliveHeader(data: string | Buffer, timeout: number) {
    let output = null;

    if (isString(data)) {
        try {
            output = encodeCString(data) + '; format=cstring';
        } catch (ex) {
            output = null;
        }
    }

    if (output == null) {
        const buffer = isString(data) ? Buffer.from(data) : data;
        output = buffer.toString('base64') + '; format=base64';
    }

    output += `; timeout=${Math.floor(timeout)}`;

    return output;
}

export function createMetaHeader(data: object) {
    return Object.entries(data)
        .map(([key, value]) => {
            return `${key}="${escapeQuotes(value)}"`;
        })
        .join(', ');
}

export function createNextLinkHeader(uri: string, timeout: number = 0) {
    let output = `<${uri}>; rel=next`;
    if (timeout > 0) {
        output += `; timeout=${Math.floor(timeout)}`;
    }
    return output;
}

export function parseQueryString(query: string): { [key: string]: string } {
    // Input is expected to be URL-encoded. This means that spaces should be
    // represented as '+', and characters not safe for URLs (especially '+')
    // need to be represented with %XX encoding.
    const paramsObj = querystring.parse(query);

    // Flatten parsed query string
    const params: { [key: string]: string } = {};
    for (const [key, val] of Object.entries(paramsObj)) {
        if (Array.isArray(val)) {
            params[key] = val[0];
        } else if (val != null) {
            params[key] = val;
        }
    }

    return params;
}

export function flattenHeader(value: undefined | string | string[]) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

export async function readRequestBody(req: IncomingMessage & { body?: string | Buffer }) {

    let body: string | Buffer | undefined;
    if (req.body != null) {
        body = req.body;
    } else {
        debug("Reading body - start");
        body = await new Promise((resolve) => {
            const bodySegments: any[] = [];
            req.on('data', (chunk) => {
                bodySegments.push(chunk);
            });
            req.on('end', () => {
                const bodyBuffer = Buffer.concat(bodySegments);
                resolve(bodyBuffer);
            });
        });
        if (body != null) {
            if (body instanceof Buffer) {
                debug("body (Buffer)", body.toString('base64'));
            } else {
                debug("body (string)", body);
            }
        } else {
            debug("body is null");
        }
        debug("Reading body - end");
    }

    return body;

}
