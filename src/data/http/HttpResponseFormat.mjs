import Response from '../Response.mjs';

// The HttpResponseFormat class is the format used to publish messages to
// HTTP response clients connected to a GRIP proxy.
export default class HttpResponseFormat extends Response {

    // The name used when publishing this format.
    name() { return 'http-response'; }

}
