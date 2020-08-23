import * as querystring from 'querystring';
import { encodeCString, escapeQuotes, isString } from './string';

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
