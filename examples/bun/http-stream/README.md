# HTTP Streaming Example for Bun

This example illustrates the use of GRIP to stream HTTP responses
using a Bun application as the backend.

## Running the example

For instructions on setting up and running the example, either locally or using
Fastly Fanout as the GRIP proxy, refer to the [`README` file in the parent directory](../).

This example also requires `curl`, which is included with most OSes.

## Testing the example

After you have set up Pushpin and started the application, test the example
following these steps.

> NOTE: If you are using Fastly Fanout as the GRIP proxy, follow these steps, but
replace `127.0.0.1:7999` with the public URL of your Fanout Forwarding service.

1. Open a new terminal window, and type the following:

```
curl http://127.0.0.1:7999/api/stream
```

You should see the following response text, and then the response should hang open:
```
[stream open]
```

`curl` now has an open HTTP stream, held open by Pushpin (listening on a channel internally called `test`).

2. Open a separate terminal window, and type the following:

```
curl -X POST -d "Hello" "https://127.0.0.1:7999/api/broadcast"
```

This publishes the given message (to the channel `test`).  You should see the message `Hello`
appear in the stream held open by the first terminal.

## How it works

For an explanation of the common startup and initialization code, as well as
validating the GRIP header, refer to the [`README` file in the parent
directory](../README.md#description-of-common-code-between-the-examples).

The request handling section of this example goes on to handle two routes:

1. A `GET` request at `/api/stream`

This endpoint is intended to be called through your configured GRIP proxy.

The handler checks `gripStatus.isProxied` to make sure we are being run behind a valid
GRIP proxy. This value will be `false` if the request did not come through a GRIP proxy,
or if the signature validation failed.

```typescript
if (!gripStatus.isProxied) {
// emit an error
}
```

If successful, then the handler goes on to set up a GRIP instruction.
This instruction asks the GRIP proxy to hold the current connection open
as a streaming connection, listening to the channel named `'test'`.

```typescript
const gripInstruct = new GripInstruct('test');
gripInstruct.setHoldStream();
```

Finally, a response is generated and returned, including the
`gripInstruct` in the response headers.

```typescript
return new Response(
    '[stream open]\n',
    {
        status: 200,
        headers: {
            ...gripInstruct.toHeaders(),
            'Content-Type': 'text/plain',
        },
    },
);
```

That's all that's needed to hold a connection open. Note that the connection between
your backend and the GRIP proxy ends here. After this point, the GRIP proxy holds the
connection open with the client.

2. A `POST` request at `/api/publish`

This handler starts by checking to make sure the content type header specifies that
the body is of type `text/plain`. Afterward, the handler reads the request body into
a string.

```typescript
if (request.headers.get('content-type')?.split(';')[0] !== 'text/plain') {
// emit an error
}
const body = await request.text();
```

Next, the handler proceeds to call `publisher.publishHttpStream` to send the
body text as a message to the `test` channel. Any listener on this channel,
such as those that have opened a stream through the endpoint described above,
will receive the message.

```typescript
await publisher.publishHttpStream('test', body + '\n');
```

Finally, it returns a simple success response message and ends.

```typescript
return new Response(
    'Ok\n',
    {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    },
);
```
