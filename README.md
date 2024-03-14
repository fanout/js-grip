# js-grip

A [GRIP](https://pushpin.org/docs/protocols/grip/) interface library for JavaScript.  For use with HTTP reverse proxy servers
that support the GRIP interface, such as Pushpin.

Supported GRIP servers include:

* [Pushpin](https://pushpin.org/)
* [Fastly Fanout](https://docs.fastly.com/products/fanout)

Authors: Katsuyuki Omuro <komuro@fastly.com>, Konstantin Bokarius <kon@fanout.io>

## New for v4

### Breaking changes

- Simplified build, now exported as ESM modules only. If you require CommonJS support or
  a browser build, use v3.
- A number of classes and interfaces have been removed for simplification. Particularly, base
  classes designed for overriding have been removed in favor of configuration.
- A number of classes whose fields had previously been public now hold them privately; those values
  must now be accessed through accessor functions.
- The `isWsOverHttp()` and `getWebSocketContextFromReq()` functions now work with
  `Request` objects rather than Node.js's `IncomingMessage` objects. Versions of these
  functions that work with `IncomingMessage` are available from `"@fanoutio/grip/node"`.

For detailed breaking changes, see the [detailed list](#detailed-breaking-changes).

### Other changes

- Updated to be [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)-first, allowing
  for running natively under more platforms such as Fastly Compute, Cloudflare Workers, Deno, Bun, etc.
  without the need for polyfilling Node.js builtins.
- Separated out Node.js support into its own export, `"@fanoutio/grip/node"`.
- `GRIP_URL` now allows `key` and `verify-key` query parameters to be provided as:
  - JSON stringified representation of `JsonWebKey`
  - base64-encoded representations (prefixed with `base64:`) of `Uint8Array`, JSON-stringified `JsonWebKey`,
    or PEM file (SPKI or PKCS#8).
  - Also see [More on Keys](#more-on-keys).
- `parseGripUri` now accepts a second parameter which can be used to merge parameters into a `IGripConfig`.
- `validateGripSig` is now available on `Publisher`, allowing you to easily check a
  `Grip-Sig` header against the publisher clients registered with a `Publisher`.
- `Publisher` can now be configured with a custom channel prefix that will be applied
  when publishing messages.
- `Publisher` can now be configured with an override `fetch()` function that will be
  called when publishing messages.
- Public Keys for Fastly Fanout are now exported as constants.
 
## Installation

```sh
npm install @fanoutio/grip
```

## Usage

Configure a publisher.

```javascript
import { Publisher } from '@fanoutio/grip';

const publisher = new Publisher({
  control_uri: 'http://pushpin.myproject.com/', // Control URI of your Pushpin instance
});

// or

const publisher = new Publisher(process.env.GRIP_URL); // A GRIP_URL representing your GRIP proxy

// or 

const gripURL = process.env.GRIP_URL || 'http://127.0.0.1:5561/';
const gripVerifyKey = process.env.GRIP_VERIFY_KEY;
const gripConfig = parseGripUri(gripURL, { 'verify-key': gripVerifyKey }); // Merge a key into the GRIP_URL
const publisher = new Publisher(gripConfig);
```

Validate a GRIP signature.

```javascript
// publisher instantiated above
const gripSig = req.headers.get('Grip-Sig');
const { isProxied, isSigned } = await publisher.validateGripSig(gripSig);
```

Publish an HTTP streaming message.

```javascript
// publisher instantiated above
await publisher.publishHttpStream('<channel>', 'Test Publish!');
```

Publish an HTTP long-polling response message.

```javascript
// publisher instantiated above
await publisher.publishHttpResponse('<channel>', 'Test Publish!');
```

## Code examples

If you're familiar with the concepts of [GRIP](https://pushpin.org/docs/protocols/grip/),
then it may be beneficial to go browse the [Examples](./examples) at this point, and then
come back to this document for reference.

## Using js-grip

[Generic Realtime Intermediary Protocol](https://pushpin.org/docs/protocols/grip/), otherwise known as GRIP,
is a mechanism that allows your backend application to use a GRIP-compatible HTTP proxy server to hold
incoming connections open.

GRIP is composed of two parts:
* Validating incoming requests and subscribing them to channels
* Publishing messages to channels

This library includes the `Publisher` class, which helps you with these tasks.
To configure the `Publisher` class, you'll use a GRIP configuration object.

### The GRIP configuration object

The GRIP configuration object (`IGripConfig` interface in TypeScript) represents the configuration for a single
GRIP proxy and its publishing endpoint. It has the following fields:

* `control_uri` - _string_ Used for publishing. The Control URI of the GRIP proxy.
* `user` - _string_ Used for authorization during publishing.
  * If the GRIP publishing endpoint allows [Basic Authorization](https://en.wikipedia.org/wiki/Basic_access_authentication)
    (not recommended), then the publisher uses this value as the username.  
* `pass` - _string_ Used for authorization during publishing.
  * If the GRIP publishing endpoint allows Basic Authorization (not recommended), then the publisher uses this value as 
    the password.
* `control_iss` - _string_ Used for authorization during publishing.
  * If the GRIP publishing endpoint allows [JSON Web Tokens](https://jwt.io/) for authorization, the publisher sets the `iss` claim of the JWT to this value.
* `key` - _string_ or _Uint8Array_ or _[CryptoKey](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)_ or
  _[KeyObject](https://nodejs.org/api/crypto.html#class-keyobject)_ Used for authorization during publishing.
  * If `control_iss` is also provided, if the GRIP publishing endpoint allows JSON Web Tokens for authorization, the publisher signs the JWT using this key.
  * If this is provided as a _string_, and `control_iss` is not provided, then if the GRIP publishing endpoint allows Bearer Tokens for authorization, the publisher uses this value as the Bearer token.
* `verify_key` - _Uint8Array_ or _CryptoKey_ or _KeyObject_ Used for validating an incoming request.
  * If this value is set, then the `Grip-Sig` header is verified as a JWT using this key. 
* `verify_iss` - _string_ Used for validating an incoming request.
  * If `verify_key` and this value are set, the `Grip-Sig` header is only considered to successfully verify
    if its `iss` claim of the JWT matches this value.

`control_uri` is the only required field. The other fields may be required depending on your setup.

`key` and `verify_key` may also be provided as `string` or `Uint8Array` that
encodes keys in PEM or JWK formats. See [More on Keys](#more-on-keys).

> NOTE: If your backend is running on Fastly Compute, as of this writing (@fastly/js-compute@3.8.3),
> Fastly Compute does not support PEM-formatted keys.

> NOTE: For backwards-compatibility reasons, if JWT authorization is used with a symmetric secret (`control_iss` and
`key` are both provided, and `key` is not a private key) and `verify_key` is not provided, then `key` will also be
used as the `verify_key` value.

#### Fastly Fanout as a GRIP proxy

If you're using Fastly Fanout, then `control_uri`, `key`, `verify_iss`, and `verify_key` are required
and should be set to the following values:

* `control_uri` - The string value `https://api.fastly.com/service/<service-id>`, where `<service-id>` is your Fastly service ID,
  with [Fanout enabled](https://www.fastly.com/documentation/guides/concepts/real-time-messaging/fanout/#quick-start).
* `key` - A [Fastly API token](https://docs.fastly.com/en/guides/using-api-tokens) that has `global` scope access to
  your service, as a string value. 
* `verify_iss` - The string value `fastly:<service-id>`, where `<service-id>` is your Fastly service ID.
* `verify_key` - The following object, which is also available from this library as the exported constant
  `PUBLIC_KEY_FASTLY_FANOUT_JWK`. 
  ```json
  {
    "kty":"EC",
    "crv":"P-256",
    "x":"CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg",
    "y":"7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M"
  }
  ```

```javascript
import { PUBLIC_KEY_FASTLY_FANOUT_JWK } from '@fanoutio/grip/fastly-fanout';

// Replace '<SERVICE_ID>' and '<FASTLY_API_TOKEN>' with appropriate values
const gripConfig = {
  control_uri: 'https://api.fastly.com/service/<SERVICE_ID>',
  key: '<FASTLY_API_TOKEN>',
  verify_iss: 'fastly:<SERVICE_ID>',
  verify_key: PUBLIC_KEY_FASTLY_FANOUT_JWK,
};

const publisher = new Publisher(gripConfig);
```

As a convenience, you can use the `buildFanoutGripConfig()` function exported from `@fanoutio/grip/fastly-compute` to
build the GRIP configuration object for Fastly Fanout.

```javascript
import { buildFanoutGripConfig, Publisher } from '@fanoutio/grip/fastly-compute';

const gripConfig = buildFanoutGripConfig({
  serviceId: '<service-id>',         // Service of GRIP proxy
  apiToken: '<fastly-api-token>',    // API token that has 'global' scope on above service
});

const publisher = new Publisher(gripConfig);
```

> TIP: It's also possible to configure Fastly Fanout using `GRIP_URL`. See [GRIP_URL](#the-grip_url) for
> details.

> TIP: API tokens should be handled with care.

### The GRIP_URL

The fields in a GRIP configuration object can be combined into a single compact URL. The URL
is built as the `control_uri` with the other values added as query parameters.

This value is often stored in an environment variable or configuration store with the name
`GRIP_URL`. As it is a URL, it is easy to move the configuration between environments.

The `verify_key` is sometimes large, especially when public keys are used. In this case, it is
stored separately as a `GRIP_VERIFY_KEY`, and the values are merged at runtime:

```javascript
const gripURL = process.env.GRIP_URL || 'http://127.0.0.1:5561/';
const gripVerifyKey = process.env.GRIP_VERIFY_KEY;
const gripConfig = parseGripUri(gripURL, { 'verify-key': gripVerifyKey });
```

> TIP: Because GRIP_URL can contain secrets (API token or private/shared key for signing), it should
> be handled with care.

> TIP: `GRIP_URL` and `GRIP_VERIFY_KEY` can be used with Fastly Fanout as well. This can simplify your code by
> allowing it to be configured through a single code path.
> 
> To do so, use these values (replace `<SERVICE_ID>` and `<FASTLY_API_TOKEN>` with appropriate values):
> ```
> GRIP_URL='https://api.fastly.com/service/<SERVICE_ID>?key=<FASTLY_API_TOKEN>&verify-iss=fastly:<SERVICE_ID>'
> GRIP_VERIFY_KEY='{"kty":"EC","crv":"P-256","x":"CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg","y":"7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M"}'
> ```

### Instantiate the `Publisher` object

Instantiate the `Publisher` object by passing the GRIP configuration object to its constructor.

```javascript
import { Publisher } from '@fanoutio/grip';

const publisher = new Publisher({
  control_uri: 'http://pushpin.myproject.com/', // Control URI of your Pushpin instance
});

// or

const gripURL = process.env.GRIP_URL || 'http://127.0.0.1:5561/';
const gripVerifyKey = process.env.GRIP_VERIFY_KEY;
const gripConfig = parseGripUri(gripURL, { 'verify-key': gripVerifyKey });
const publisher = new Publisher(gripConfig); // You can pass a gripConfig if you've already parsed it

// or

const publisher = new Publisher(process.env.GRIP_URL); // You can even pass a GRIP_URL directly
```

> NOTE: If your backend application is running on Fastly Compute, then you'll need to further configure the
> `Publisher`. See [Sending publish messages from Fastly Compute](#sending-publish-messages-from-a-fastly-compute-application) below.

### Validating Incoming Requests

When an incoming client request arrives at the GRIP proxy over HTTP, the proxy forwards the request to
your backend application and adds the `Grip-Sig` header to the proxied request.

It's highly recommended that your backend application validate this `Grip-Sig` to make sure it's coming
from your GRIP proxy. To do this, call `publisher.validateGripSig()`:

```javascript
// publisher instantiated above
const gripSig = req.headers.get('Grip-Sig');
const { isProxied, isSigned } = await publisher.validateGripSig(gripSig);
```

If your publisher is configured with a `verify_key`, then the signature of `Grip-Sig` will be checked 
with that key. Both `isSigned` and `isProxied` will be `true` only if the key was able to verify the
signature.

If your publisher is not configured with a `verify_key`, then `isSigned` will be `false`, and
`isProxied` will only check for the presence of `Grip-Sig`.

> NOTE: For backwards-compatibility reasons, if JWT authorization is used with a symmetric secret (`control_iss` and
`key` are both provided, and `key` is not a private key) and `verify_key` is not provided, then `key` will be
used as the `verify_key` value as well.

### Publishing messages to channels

To publish a message, call one of the publishing methods on the publisher, which depends on the
type of GRIP interaction.

For an HTTP long-polling response message:
```javascript
// publisher instantiated above
await publisher.publishHttpResponse('<channel>', 'Test Publish!');
```

For an HTTP streaming message:
```javascript
// publisher instantiated above
await publisher.publishHttpStream('<channel>', 'Test Publish!');
```

For a WebSocket-over-HTTP message:
```javascript
// publisher instantiated above
await publisher.publishFormats('<channel>', new WebSocketMessageFormat('Test Publish!'));
```

#### Overriding fetch

The `Publisher` class constructor accepts an optional second parameter that is used
to customize its behavior. By default, publishing messages through the `Publisher`
class uses the [global `fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
function as the underlying mechanism. By providing a value for `fetch`, we are able to
override this behavior.

> TIP: You may want to do this if your backend is running on Fastly Compute. See the section
> below on [publishing messages from a Fastly Compute application](#sending-publish-messages-from-a-fastly-compute-application)

#### Prefixes

For namespacing reasons, it's sometimes useful to prefix the channel name when publishing.
To do this, set the `prefix` value in the configuration parameter when instantiating the `Publisher`.

```javascript
const publisher = new Publisher(process.env.GRIP_URL, { prefix: 'foo_' });
await publisher.publishHttpStream('test', 'Test Publish!'); // Message is sent to channel named 'foo_test'
```

#### Sending publish messages from a Fastly Compute application

Publishing messages through the `Publisher` class uses the [global `fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
function as the underlying mechanism. If your backend application is running on Fastly Compute, a `backend` parameter
is usually required when making a `fetch` call (unless [Dynamic Backends](https://www.fastly.com/documentation/guides/integrations/backends/#dynamic-backends)
is enabled for your service).

One simple way to accomplish this by providing an override for `fetch` when constructing your `Publisher` instance. 
This example inserts a `backend` parameter value of `'publisher'` when the `Publisher` makes outgoing `fetch()` calls.

```javascript
const publisher = new Publisher(gripConfig, {
    fetch(input, init) {
        return fetch(String(input), { ...init, backend: 'publisher' });
    },
});
```

### Advanced: Publisher with multiple GRIP proxies

It's also possible to instantiate a `Publisher` with more than one GRIP proxy.
To do this, simply pass an array of GRIP configurations to the constructor.

When you do this, validating incoming requests works slightly differently:
If all the GRIP configurations require validation, then `isProxied` and `isSigned` are `true` if
at least one GRIP configuration successfully verifies the signature.
If one or more of the GRIP configurations does not require validation, then the signature
is not checked. `isSigned` is `false`, and `isProxied` is set based on the presence of `Grip-Sig`.

When publishing messages, each GRIP configuration is published to in parallel. The promise returned
from the publish call resolves when publishing to all configurations completes, or rejects when publishing
to any of the configurations fails.

## Subscribing

Once you've verified that your request is proxied behind GRIP, your backend
application can, as part of its execution, decide to have the GRIP proxy
hold the connection and subscribe it to channels.

This is done either as a `GripInstruct` for HTTP long-polling and streaming,
or as a `WebSocketContext` for WebSocket-over-HTTP.

### GripInstruct

With an HTTP transport such as long-polling and streaming, your backend application
includes HTTP headers known as GRIP instructions along with the response.
These instructions indicate the action that the GRIP proxy is to take.

When it comes time to return the response, include the GRIP instructions with
the response by calling `toHeaders()` on them and including them with the
response headers.

#### HTTP long-polling

```javascript
const gripInstruct = new GripInstruct();
gripInstruct.addChannel('<channel>');
gripInstruct.setHoldLongPoll();
// To optionally set a timeout value in seconds:
// gripInstruct.setHoldLongPoll(<timeout_value>);

return new Response(
    'Body',
    {
        status: 200,
        headers: {
            ...gripInstruct.toHeaders(),
            'Content-Type': 'text/plain',
        }
    }
);
```

> TIP: If the response status code is 304, some platforms will refuse to
> send custom HTTP response headers. To work around this issue, you can 
> call `gripInstruct.setStatus()`.
> 
> ```javascript
> const gripInstruct = new GripInstruct();
> gripInstruct.addChannel('<channel>');
> gripInstruct.setHoldLongPoll();
>
> // Set 304 here
> gripInstruct.setStatus(304);
>
> // Send 200 to your platform
> return new Response(
>     'Body',
>     {
>         status: 200,
>         headers: {
>             ...gripInstruct.toHeaders(),
>             'Content-Type': 'text/plain',
>         }         
>     }
> );
> ```

#### HTTP streaming

```javascript
const gripInstruct = new GripInstruct();
gripInstruct.addChannel('<channel>');
gripInstruct.setHoldStream();

return new Response(
    'Body',
    {
        status: 200,
        headers: {
            ...gripInstruct.toHeaders(),
            'Content-Type': 'text/plain',
        }
    }
);
```

### WebSocket-over-HTTP

The [WebSocket-Over-HTTP](https://pushpin.org/docs/protocols/websocket-over-http/) protocol is a
simple, text-based protocol for acting as a gateway between a WebSocket client and a conventional HTTP server.
It is available as a feature of Pushpin and Fastly Fanout.

Events from the WebSocket client, including opening, closing, and sending of messages,
are transformed by the GRIP proxy into HTTP POST requests and arrive at the backend application.

The backend can use the `isWsOverHttp()` function to on the `Request` to detect whether
the reqeust is using this protocol, and if it is, the `getWebSocketContextFromReq()` function to
consume the `Request` and obtain an instance of the `WebSocketContext` class.

```javascript
let wsContext = null;
if (gripStatus.isProxied && isWsOverHttp(request)) {
    wsContext = await getWebSocketContextFromReq(request);
}
```

This object contains a queue of the current batch of incoming WebSocket messages, as well
as a queue of outgoing WebSocket messages.

At this point the typical WebSocket-over-HTTP application:
* handles an OPEN message 
* handles a CLOSE message
* handles any other messages

OPEN messages can be checked by calling `isOpening()` on the WebSocket context.
If so, the usual course of action is to call `accept()` as well as `subscribe()`
on the WebSocket context. Keep in mind that these actions are simply queued up
as outgoing WebSocket messages at this stage.

```javascript
if (wsContext.isOpening()) {
    wsContext.accept();
    wsContext.subscribe('test');
}
```

For other messages, iterate the queue of incoming messages on the WebSocket context
by checking `canRecv()` and `recv()` (or `recvRaw()`, if the message may include binary data).

```javascript
while (wsContext.canRecv()) {
    const message = wsContext.recv();
    
    // handle message ...
}
```

`recv()` returns `null` if the message was CLOSE. In this case, send a CLOSE back
to close the WebSocket cleanly.

```javascript
    if (message == null) {
        wsContext.close();
        break;
    }
```

Otherwise, `recv()` returns the string content of the WebSocket message (if `recvRaw()`
is used, then `BINARY` messages will return a `Uint8Array` of the bytes).
It's now up to your application to perform any application logic and handle this message.

Usually, to send messages back to the caller, call one of these functions. Again, keep in
mind that these messages are just queued at this point.
* `send()`
* `sendBinary()`
* `sendControl()`

For example, if you are writing an echo server, you may do something like this:

```javascript
    wsContext.send(message);
```

Finally, the outgoing messages in the WebSocket context need to be sent as the
HTTP response. To do this, serialize the outgoing messages and send it, along
with any headers that the WebSocket context would represent, in the HTTP response.

```javascript
const events = wsContext.getOutgoingEvents();
const responseBody = encodeWebSocketEvents(events);

return new Response(
    responseBody,
    {
        status: 200,
        headers: wsContext.toHeaders(),
    },
);
```

## Reference

The package uses standard exports to make functions, classes, and interfaces available.

```javascript
import { createWebSocketControlMessage, Publisher, Format, Item } from '@fanoutio/grip';
```

| Function                                    | Description                                                                                                                    |
|---------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `validateSig(token, key, iss)`              | Validates the specified JWT token with the provided key, and (optionally) validate the `iss` claim.                            |
| `encodeWebSocketEvents(events)`             | Encodes the specified array of WebSocketEvent instances.                                                                       |
| `decodeWebSocketEvents(body)`               | Decodes the specified HTTP request body into an array of WebSocketEvent instances when using the WebSocket-over-HTTP protocol. |
| `parseGripUri(uri, additionalParams)`       | Parses the specified GRIP URI into a config object that can then be used to construct a `Publisher` instance.                  |
| `createWebSocketControlMessage(type, args)` | Generates a WebSocket control message with the specified type and optional arguments.                                          |
| `isWsOverHttp(req)`                         | Detects whether the current request is using the WebSocket-over-HTTP protocol.                                                 |
| `getWebSocketContextFromReq(req, prefix)`   | Parses the body of the request and return an array of WebSocketEvent instances.                                                |

| Class                    | Description                                                                                       |
|--------------------------|---------------------------------------------------------------------------------------------------|
| `Publisher`              | Main object used to publish messages to GRIP proxies.                                             |
| `GripInstruct`           | Class used to create the necessary HTTP headers that instruct the GRIP proxy to hold connections. |
| `WebSocketContext`       | WebSocket context                                                                                 |
| `WebSocketEvent`         | WebSocket event                                                                                   |
| `WebSocketMessageFormat` | Format used to publish messages to Web Socket clients connected to a GRIP proxy.                  |

| Interfaces     | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `IGripConfig`  | Represents a GRIP client's configuration                                    |

Class `GripInstruct`

| Method                        | Description                                                                                                                                                                                          |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| constructor(`channels?`)      | Create a `GripInstruct` instance, configuring it with an optional array of channels to bind to.                                                                                                      |
| `addChannel(channels)`        | Bind to additional channels.                                                                                                                                                                         |
| `setHoldLongPoll(timeout?)`   | Set the `Grip-Hold` header to the `response` value, and specify an optional timeout value.                                                                                                           |
| `setHoldStream()`             | Set the `Grip-Hold` header to the `stream` mode.                                                                                                                                                     |
| `setKeepAlive(data, timeout)` | Set the `Grip-Keep-Alive` header to the specified data value and timeout value. The value for `data` may be provided as either a string or `Buffer`, and the appropriate encoding will be performed. |
| `setNextLink(uri, timeout?)`  | Set the `Grip-Link` header to the specified uri, with an optional timeout value.                                                                                                                     |
| `meta` (property)             | A property to be set directly on the instance. This is serialized into the `Grip-Set-Meta` header.                                                                                                   |
| `toHeaders(params)`           | Turns the current instance into an object that can be sent as HTTP headers.                                                                                                                          |

Class `Publisher`

| Method                                                   | Description                                                                                         |
|----------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| constructor(`configs, options`)                          | Create a `Publisher` instance, configuring it based on the specified GRIP settings.                 |
| `async publishFormats(channel, formats, id?, prevId?)`   | Publish an item to the specified channel by building it from the provided formats.                  |
| `async publishHttpResponse(channel, data, id?, prevId?)` | Publish an HTTP response format message to the specified channel, with optional ID and previous ID. |
| `async publishHttpStream(channel, item)`                 | Publish an HTTP stream format message to the specified channel, with optional ID and previous ID.   |
| `applyConfig(configs)`                                   | Advanced: Apply an additional GRIP proxy based on the specified GRIP config.                        |
| `applyConfigs(configs)`                                  | Advanced: Apply additional clients based on specified GRIP configs.                                 |
| `addClient(client)`                                      | Advanced: Add a `IPublisherClient` instance that you have configured on your own.                   |
| `async publish(channel, item)`                           | Advanced: Publish an item to the specified channel.                                                 |

The constructor and `applyConfigs` methods accept either a single object, or an array of objects that implement
the `IGripConfig` interface.

Interface `IGripConfig`

Represents the configuration for a GRIP proxy.

| Field         | Description                                                                      |
|---------------|----------------------------------------------------------------------------------|
| `control_uri` | The Control URI of the GRIP proxy.                                               |
| `user`        | (optional) The user to use with the Control ISS, if required by the GRIP client. |
| `pass`        | (optional) The pass to use with the Control ISS, if required by the GRIP client. |
| `control_iss` | (optional) The Control ISS, if required by the GRIP client.                      |
| `key`         | (optional) The key to use with the Control ISS, if required by the GRIP client.  |
| `verify_iss`  | (optional) The ISS to use when validating a GRIP signature.                      |
| `verify_key`  | (optional) The key to use when validating a GRIP signature.                      |

Class `Format`

A base class for all publishing formats that are included in the Item class.
Examples of format implementations include HttpStreamFormat and HttpResponseFormat.

## Additional Notes

### Usage with TypeScript

This package comes with full TypeScript type definitions, so you may use it with
TypeScript as well.

```javascript
import { Publisher, IGripConfig } from '@fanoutio/grip';
const pub = new Publisher({control_uri: "<endpoint_uri>"});

// IGripConfig is a type declaration.
```

### More on Keys

The following apply to the `key` and `verify_key` fields of the GRIP configuration object.

Binary values for `key` and `verify_key` may be provided as `Uint8Array`, but they may also be provided as
[base64-encoded strings](https://developer.mozilla.org/en-US/docs/Glossary/Base64). To do so, prefix the values with
`base64:`, and the values will be converted to `Uint8Array` as they are read.

They may also be provided as [CryptoKey](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) or
[KeyObject](https://nodejs.org/api/crypto.html#class-keyobject), which are runtime-specific key representations
(CryptoKey in the browser and Web-interoperable runtimes, as well as KeyObject in Node.js). Refer to your platform's
documentation to import keys of these types.

They may also be provided as JsonWebKey objects (or JSON-stringified representations of JsonWebKey
objects or `Uint8Array` encodings of JSON-stringified representations of JsonWebKey objects), where
`key` must be a private key or symmetric secret, and `verify_key` must be a public key or
symmetric secret. In these cases, they will be converted to CryptoKey or KeyObject as they are read.

Finally, they may also be provided as PEM-encoded strings (or `Uint8Array` encodings of PEM-encoded strings):
`key` as a PEM-encoded PKCS#8 private key, and `verify_key` as a PEM-encoded SPKI public key.
In these cases, they will be converted to CryptoKey or KeyObject as they are read.

> NOTE: If your backend is running on Fastly Compute, as of this writing (@fastly/js-compute@3.8.3),
> Fastly Compute does not support PEM-formatted keys.

> NOTE: For backwards-compatibility reasons, if JWT authorization is used with a symmetric secret (`control_iss` and
`key` are both provided, and `key` is not a private key) and `verify_key` is not provided, then `key` will also be
used as the `verify_key` value.

### Detailed Breaking Changes

- The authorization classes now require the `buildHeader()` function to return a `Promise` that
  resolves to a `string`. Previously they returned the `string` directly.
- `HttpResponseFormat` now specifically works with `string` and `Uint8Array`.
  Previously the body could be anything that supported a `.toString()` function.
- `IWebSocketEvent` now requires the `content` field and `getContent` accessor to be
  `string` or `Uint8Array`. Previously, this could also be `number[]`, but this is no longer
  supported.
- `WebSocketContext` now requires the `meta` parameter of its constructor to be an object whose
  values are `string`. Previously, this could be any JavaScript object.
- `WebSocketEvent` now requires the `content` parameter of its constructor to be
  `string` or `Uint8Array`. Previously, this could also be `number[]`, but this is no longer
  supported.
- `createWebSocketControlMessage` now requires the `args` parameter to be an object whose
  values are `string`. Previously, this could be any JavaScript object.
- `GripInstruct` now requires the `meta` field, if it's used, to be an object whose
  values are `string`. Previously, this could be any JavaScript object.
- `IFormat` now requires the `export()` function to return an object whose values are JSON-serializable.
  Previously, values could be of any type.
- `IItemExport` now requires the `formats` field to be an object whose values are JSON-serializable.
  Previously, values could be of any type.
- Classes that have been removed:
  - `Auth.Base`
  - `Response`
  - `NodeApiRequest`
  - `NodeApiResponse`
  - `PublisherBase`
  - `PublisherTransport`
- Class fields and functions that have been removed:
  - `Auth.Basic`
    - `user` - use `getUser()`
    - `pass` - use `getPass()`
  - `Auth.Bearer`
    - `token` - use `getToken()`
  - `Auth.Jwt`
    - `claim` - use `getClaim()`
    - `key` - use `getKey()`
  - `PublisherClient`
    - `auth` - use `getAuth()`
    - `transport`
    - `verifyComponents` - use `getVerifyIss()` and `getVerifyKey()`
    - `setAuthBasic()`
    - `setAuthBearer()`
    - `setAuthJwt()`
    - `setVerifyComponents()`
    - `_startPubCall()`
    - `_performHttpRequest()`
    - `_finishHttpRequest()`
  - `Publisher`
    - `buildPublisherClient()`
    - `parseGripUri()`
  - `WebSockeContext`
    - `inEvents`
    - `readIndex`
- Interfaces that have been removed:
  - `FetchResponse`
  - `IApiRequest`
  - `IApiResponse`
  - `IExportedResponse`
  - `IGripConfigBase`
  - `IPublisherTransport`
  - `IReqHeaders`
- Functions that have been removed:
  - `flattenHeader()`
  - `getWebSocketContextFromApiRequest()`
  - `isApiRequestWsOverHttp()`
  - `isString()`
  - `toBuffer()`
  - `parseGripUriCustomParams()`
  - `parseQueryString()`

## License

(C) 2015, 2020 Fanout, Inc.  
(C) 2023 Fastly, Inc.
Licensed under the MIT License, see file LICENSE.md for details.
