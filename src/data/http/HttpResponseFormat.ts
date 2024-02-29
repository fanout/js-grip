import { encodeBytesToBase64String } from '../../utilities/index.js';
import type { IFormat } from '../IFormat.js';
import type { IFormatExport } from '../IFormatExport.js';

type ExportedResponse = {
    code?: string;
    reason?: string;
    headers?: Record<string, string>;
    body?: string;
    'body-bin'?: string;
};

export type ResponseParams = {
    code?: string | null,
    reason?: string | null,
    headers?: Record<string, string> | null,
    body?: Uint8Array | string | null,
}

// The HttpResponseFormat class is the format used to publish messages to
// HTTP response clients connected to a GRIP proxy.
export class HttpResponseFormat implements IFormat {
    code: string | null;
    reason: string | null;
    headers: Record<string, string> | null;
    body: Uint8Array | string | null;

    constructor(responseObject: ResponseParams);
    constructor(
        code?: string | null,
        reason?: string | null,
        headers?: Record<string, string> | null,
        body?: Uint8Array | string | null,
    );
    constructor(
        code: ResponseParams | string | null = null,
        reason: string | null = null,
        headers: Record<string, string> | null = null,
        body: Uint8Array | string | null = null,
    ) {
        if (code !== null && typeof code !== 'string') {
            ({ code = null, reason = null, headers = null, body = null } = code);
        }
        this.code = code;
        this.reason = reason;
        this.headers = headers;
        this.body = body;
    }

    // Export this Response instance into a dictionary containing all
    // of the non-null data. If the body is set to a buffer then export
    // it as 'body-bin' (as opposed to 'body') and encode it as base64.
    export() {
        const obj: ExportedResponse = {};
        if (this.code != null) {
            obj.code = this.code;
        }
        if (this.reason != null) {
            obj.reason = this.reason;
        }
        if (this.headers != null) {
            obj.headers = this.headers;
        }
        if (this.body != null) {
            if (this.body instanceof Uint8Array) {
                obj['body-bin'] = encodeBytesToBase64String(this.body);
            } else {
                obj['body'] = this.body.toString();
            }
        }
        return obj as IFormatExport;
    }

    // The name used when publishing this format.
    name() {
        return 'http-response';
    }
}
