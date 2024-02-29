import { encodeCString, escapeQuotes } from './string.js';
import { encodeBytesToBase64String } from './base64.js';

export function createKeepAliveHeader(data: string | Uint8Array, timeout: number) {
    let output = null;

    if (typeof data === 'string') {
        try {
            output = encodeCString(data) + '; format=cstring';
        } catch (ex) {
            output = null;
        }
    }

    if (output == null) {
        const textEncoder = new TextEncoder();
        const bytes = typeof data === 'string' ? textEncoder.encode(data) : data;
        output = encodeBytesToBase64String(bytes) + '; format=base64';
    }

    output += `; timeout=${Math.floor(timeout)}`;

    return output;
}

export function createMetaHeader(data: Record<string, string>) {
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
