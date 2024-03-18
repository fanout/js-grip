import { type IFormat } from '../IFormat.js';
import { type IFormatExport } from '../IFormatExport.js';
import { encodeBytesToBase64String } from '../../utilities/index.js';

// The WebSocketMessageFormat class is the format used to publish data to
// WebSocket clients connected to GRIP proxies.
export class WebSocketMessageFormat implements IFormat {
    content: string | Uint8Array | null;
    close: boolean;
    code?: number;

    constructor(content: Uint8Array | string | null = null, close = false, code?: number) {
        // Initialize with either the message content or a boolean indicating that
        // the streaming connection should be closed. If neither the content nor
        // the boolean flag is set then an error will be thrown.
        if (content == null && !close) {
            throw new Error('WebSocketMessageFormat requires content.');
        }
        this.content = content;
        this.close = close;
        this.code = code;
    }

    // The name used when publishing this format.
    name() {
        return 'ws-message';
    }

    // Exports the message in the required format depending on whether the
    // message content is a buffer or not, or whether the connection should
    // be closed.
    export() {
        const obj: IFormatExport = {};
        if (this.close) {
            obj['action'] = 'close';
            if (this.code != null) {
                obj['code'] = this.code;
            }
        } else {
            if (this.content instanceof Uint8Array) {
                obj['content-bin'] = encodeBytesToBase64String(this.content);
            } else if (this.content != null) {
                obj['content'] = this.content.toString();
            }
        }
        return obj;
    }
}
