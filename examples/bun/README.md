# Examples for Bun

The examples in this directory illustrate the use of GRIP using
[Bun](https://bun.sh) as the backend.

* [`http-stream/`](./http-stream) - HTTP streaming using GRIP.
* [`websocket/`](./websocket) - WebSocket-over-HTTP using GRIP.

For details on each example, view the `README` file in its
respective directory.

## Running the examples locally

Each example can be run locally by running it alongside an instance of
[Pushpin](https://pushpin.org/).

To run the examples locally, you'll need:

* Bun - [installation instructions](https://bun.sh/docs/installation)
* Pushpin - [installation instructions](https://pushpin.org/docs/install/)

> NOTE: Instead of local Pushpin, you can also run the examples using Fastly Fanout for the GRIP proxy.
See [Running the examples on Fastly Fanout](#running-the-examples-with-fastly-fanout-as-the-grip-proxy) below.

1. Set up Pushpin by modifying the `routes` file with the following content
   (See [this page](https://pushpin.org/docs/configuration/) for details on
   Pushpin configuration):

```
* 127.0.0.1:3000
```

2. Start Pushpin.

```
pushpin
```

By default, it will listen on port 7999, with a publishing
endpoint open on port 5561. Leave Pushpin running in that terminal window.

3. In a new terminal window, switch to the example's directory, and
   install dependencies:

```
bun install
```

4. Start the example:

```
bun run start
```

This will run Bun to start the example application.

5. Go on to follow the steps under each example's `README` file.

## Description of common code between the examples

Each example has the same general structure:
* Configuring GRIP and instantiating the `Publisher`
* Setting up the request handler
* Checking GRIP status
* Handling (specific to the example)

### Configuration of GRIP

Each example interfaces with GRIP using the `Publisher` class.

To configure `Publisher`, a GRIP configuration object `gripConfig` is used.
The example applications give it a default value of `http://127.0.0.1:5561/` to point to
local Pushpin.

```typescript
let gripConfig: string | IGripConfig = 'http://127.0.0.1:5561/';
```

It may be overridden using a `GRIP_URL`, which in the Bun backend application is set as an
environment variable. Additionally, in the example, the utility function `parseGripUri` is used
to merge in the `GRIP_VERIFY_KEY` if it's required by the proxy.

```typescript
const gripUrl = Bun.env.GRIP_URL;
if (gripUrl) {
    gripConfig = parseGripUri(gripUrl, { 'verify-key': Bun.env.GRIP_VERIFY_KEY });
}
```

Alternatively, the environment variables `FANOUT_SERVICE_ID` and `FANOUT_API_TOKEN`
are checked, and if present, they are used with the `buildFanoutGripConfig()` function to
build the `gripConfig`.

```typescript
const fanoutServiceId = Bun.env.FANOUT_SERVICE_ID;
const fanoutApiToken = Bun.env.FANOUT_API_TOKEN;
if (fanoutServiceId != null && fanoutApiToken != null) {
    gripConfig = buildFanoutGripConfig({
        serviceId: fanoutServiceId,
        apiToken: fanoutApiToken,
    });
}
```

Finally, this `gripConfig` is used to instantiate `Publisher`.

```typescript
const publisher = new Publisher(gripConfig);
```

In the Bun example, this initialization happens outside the request handler to enable the
single `Publisher` instance to be reused among incoming requests.

### The request handler and GRIP status

Then the application calls `Bun.serve` to start the HTTP server and define a request handler.

```typescript
const server = Bun.serve({
    port: 3000,
    async fetch(request: Request) {
        const requestUrl = new URL(request.url);

        // handler code ...
    },
});
console.log(`Listening on http://127.0.0.1:${server.port} ...`);
```

The backend application is intended to be called via a GRIP proxy. When the handler runs,
a GRIP proxy will have inserted a `Grip-Sig` header into the request, which it has
signed with a secret or key.

The request handler calls `publisher.validateGripSig` to validate this header,
storing the result in the `gripStatus` variable.
```typescript
const gripStatus = await publisher.validateGripSig(req.headers['grip-sig']);
```

This result can be checked for three fields:
`gripStatus.isProxied` - When `true`, indicates that the current request is behind
a GRIP proxy. If `needsSigned` is `true`, then this will only be `true` if the
signature validation has also succeeded.
`gripStatus.needsSigned` - When `true`, indicates that the GRIP proxy specified in the
configuration signs incoming requests.
`gripStatus.isSigned` - When `true`, indicates that the signature validation was successful.

### Handling the request

Following this, the request handler in each example handles the request in its
respective way. Refer to the README in each project for details.

A catch-all at the end of the handler handles unhandled requests with a `404 Not
Found` error.

## Running the examples with Fastly Fanout as the GRIP proxy

By publishing these examples publicly, they can also be run behind
[Fastly Fanout](https://docs.fastly.com/products/fanout) to benefit from a global
network and holding client connections at the edge.

Aside from your backend application running publicly on the internet,
you will need a separate Fastly Compute service with Fanout enabled.
This Fastly service runs a small program at the edge that examines
each request and performs a "handoff" to Fanout for relevant requests,
allowing Fanout to hold client connections and interpret GRIP messages.

The [Fastly Fanout Forwarding Starter Kit (JavaScript)](https://github.com/fastly/compute-starter-kit-javascript-fanout-forward#readme)
can be used for this purpose. In many cases it can be used as is,
or as a starting point for further customization.

Back to [examples](../)
