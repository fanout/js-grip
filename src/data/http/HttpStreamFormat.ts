import { IFormat } from '../IFormat.js';
import { IFormatExport } from '../IFormatExport.js';
import { encodeBytesToBase64String } from '../../utilities/index.js';

// The HttpStreamFormat class is the format used to publish messages to
// HTTP stream clients connected to a GRIP proxy.
export class HttpStreamFormat implements IFormat {
    content: string | Uint8Array | null;
    close: boolean;

    constructor(content: string | Uint8Array | null = null, close = false) {
        // Initialize with either the message content or a boolean indicating that
        // the streaming connection should be closed. If neither the content nor
        // the boolean flag is set then an error will be thrown.
        if (content == null && !close) {
            throw new Error('HttpStreamFormat requires content.');
        }
        this.content = content;
        this.close = close;
    }

    // The name used when publishing this format.
    name() {
        return 'http-stream';
    }

    // Exports the message in the required format depending on whether the
    // message content is binary or not, or whether the connection should
    // be closed.
    export() {
        const obj: IFormatExport = {};
        if (this.close) {
            obj['action'] = 'close';
            obj['content'] = '';
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
