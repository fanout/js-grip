import { Buffer } from 'buffer';
import IFormat from '../IFormat';

// The WebSocketMessageFormat class is the format used to publish data to
// WebSocket clients connected to GRIP proxies.
export default class WebSocketMessageFormat implements IFormat {
    content: Buffer | string;
    close: boolean;
    code?: number;

    constructor(content: Buffer | string | null = null, close = false, code?: number) {
        // Initialize with either the message content or a boolean indicating that
        // the streaming connection should be closed. If neither the content nor
        // the boolean flag is set then an error will be thrown.
        if (content != null) {
            this.content = content;
        } else if (!close) {
            throw new Error('WebSocketMessageFormat requires content.');
        }
        this.close = close;
        this.code = code;
    }

    // The name used when publishing this format.
    name() { return 'ws-message'; }

    // Exports the message in the required format depending on whether the
    // message content is a buffer or not, or whether the connection should
    // be closed.
    export() {
        const obj = {};
        if(this.close) {
            obj['action'] = 'close';
            if(this.code != null) {
                obj['code'] = this.code;
            }
        } else {
            if(Buffer.isBuffer(this.content)) {
                obj['content-bin'] = this.content.toString('base64');
            } else {
                obj['content'] = this.content.toString();
            }
        }
        return obj;
    }
}
