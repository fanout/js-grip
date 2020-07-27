import { Buffer } from 'buffer';
import IFormat from '../IFormat';

// The HttpStreamFormat class is the format used to publish messages to
// HTTP stream clients connected to a GRIP proxy.
export default class HttpStreamFormat implements IFormat {
    content: string | Buffer;
    close: boolean;

    constructor(content: string | Buffer | null = null, close = false) {
        // Initialize with either the message content or a boolean indicating that
        // the streaming connection should be closed. If neither the content nor
        // the boolean flag is set then an error will be thrown.
        if (content == null && !close) {
            throw new Error('HttpStreamFormat requires content.');
        }
        if (content != null) {
            this.content = content;
        }
        this.close = close;
    }

    // The name used when publishing this format.
    name() { return 'http-stream'; }

    // Exports the message in the required format depending on whether the
    // message content is binary or not, or whether the connection should
    // be closed.
    export() {
        const obj = {};
        if(this.close) {
            obj['action'] = 'close';
            obj['content'] = '';
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
