import { Response } from '../Response.js';
import { IFormat } from '../IFormat.js';

// The HttpResponseFormat class is the format used to publish messages to
// HTTP response clients connected to a GRIP proxy.
export class HttpResponseFormat extends Response implements IFormat {
    // The name used when publishing this format.
    name() {
        return 'http-response';
    }
}
