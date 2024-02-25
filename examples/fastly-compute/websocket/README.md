# WebSocket-over-HTTP Example for Fastly Compute

This example illustrates the use of GRIP to handle WebSockets
using Fastly Compute as the backend.

For more information about WebSocket-over-HTTP, refer to
[this page](https://pushpin.org/docs/protocols/websocket-over-http/).

## Running the example

For instructions on setting up and running the example, either locally or using
Fastly Fanout as the GRIP proxy, refer to the [`README` file in the parent directory](../).

This example also requires `wscat`, which can be [obtained here](https://github.com/websockets/wscat).

## Testing the example

After you have set up Pushpin and started the application, test the example
following these steps.

> NOTE: If you are using Fastly Fanout as the GRIP proxy, follow these steps, but
replace `localhost:7999` with the public URL of your Fanout Forwarding service.

1. Open a new terminal window, and type the following:

```
wscat -c http://localhost:7999/api/websocket
```

You should see the following prompt:
```
Connected (press CTRL+C to quit)
> 
```

wscat is now connected to the GRIP proxy over a WebSocket. The WebSocket is subscribed to
a channel internally called `test`.

2. Enter a line of text at the prompt. The application will echo it back to you through
   the WebSocket. For example, typing `asdf`:

```
Connected (press CTRL+C to quit)
> asdf
< asdf
>
```

3. Open a separate terminal window, and type the following:

```
curl -X POST -d "Hello" "https://localhost:7999/api/broadcast"
```

This publishes the given message (to the channel `test`).  You should see the message `Hello`
appear in the WebSocket connection held by the first terminal.

## How it works

For an explanation of the common startup and initialization code, as well as
validating the GRIP header, refer to the [`README` file in the parent
directory](../README.md#description-of-common-code-between-the-examples).

Before starting the request handling, in addition to checking the GRIP status,
this example obtains the WebSocket Context. To do this, it uses the
`isWsOverHttp` and `getWebSocketContextFromReq` functions.

```javascript
let wsContext = null;
if (gripStatus.isProxied && isWsOverHttp(req)) {
    wsContext = await getWebSocketContextFromReq(req);
}
```

The request handling section of this example goes on to handle two routes:

1. A `POST` request at `/api/websocket`

WebSocket-over-HTTP always uses the `POST` method to represent WebSocket messages
converted to HTTP requests.

This endpoint is intended to be called through your configured GRIP proxy.

The handler checks `gripStatus.isProxied` to make sure we are being run behind a valid
GRIP proxy. This value will be `false` if the request did not come through a GRIP proxy,
or if the signature validation failed.

```javascript
if (!gripStatus.isProxied) {
// emit an error
}
```

It also checks `wsContext` to make sure this is indeed a WebSocket-over-HTTP message.

```javascript
if (wsContext == null) {
    return new Response(
        '[not a websocket request]\n',
        {
            status: 400,
            headers: {
                'Content-Type': 'text/plain',
            },
        },
    );
}
```

If successful, then the handler goes on to process the incoming WebSocket message(s).
The WebSocket context includes a buffer of queued-up incoming WebSocket messages
as well as a buffer to queue outgoing WebSocket messages.

First, the context is checked for the presence of an `OPEH` message (`wsContext.isOpening()`).
If so, then the WebSocket is accepted (`wsContext.accept()` queues up an outgoing `OPEN` message).
It also subscribes the WebSocket to the `test` channel.

```javascript
if (wsContext.isOpening()) {
    wsContext.accept();
    wsContext.subscribe('test');
}
```

Next, a `while` loop is used to iterate the buffer of incoming WebSocket messages.

Note that while this loop may deceivingly appear to run for the duration of the WebSocket
connection, this is not the case. The loop runs against the current batch of incoming
messages and exits, while the WebSocket connection with the client is held by the GRIP proxy.

The `wsContext.recv()` function returns the next item in the queue.

```javascript
while (wsContext.canRecv()) {
    const message = wsContext.recv();
    // handle message ..
}
```

If the incoming message was `'CLOSE'`, this function would have returned `null`.
The application responds by calling `wsContext.close()` to cleanly close the
connection and leave the loop.

```javascript
if (message == null) {
    wsContext.close();
    break;
}
```

In this simple example, the incoming message is simply echoed back to the client.
```javascript
wsContext.send(message);
```

Function such as `wsContext.accept()`, `wsContext.send()`, and `wsContext.close()`
create outgoing messages and add them to the outgoing messages list.

After the loop is exited, these outgoing messages are serialized into the response body.

```javascript
const events = wsContext.getOutgoingEvents();
const responseBody = encodeWebSocketEvents(events);
```

Finally, the response is generated and returned, using `wsContext.toHeaders()` in the
response headers.

```javascript
return new Response(
    responseBody,
    {
        status: 200,
        headers: wsContext.toHeaders(),
    },
);
```

The above is the mechanism needed to communicate over a WebSocket using GRIP. At this point,
the connection between your backend and the GRIP proxy ends, with the GRIP proxy holding the
WebSocket connection with the client. Additional client-side messages over the same WebSocket
will arrive at the same endpoint.

2. A `POST` request at `/api/broadcast`

It's also possible to send messages to an entire channel.

This handler starts by checking to make sure the content type specifies that the body
is of type `text/plain`. Afterward, the handler reads the request body into a string.

```javascript
if (req.headers['content-type'].split(';')[0] !== 'text/plain') {
// emit an error
}
const body = await request.text();
```

Next, the handler proceeds to package the message in a `WebSocketMessageFormat` object
and then sending them to a call to `publisher.publish` to the `test` channel. Any
listener on this channel, such as those that have opened a WebSocket through the
endpoint described above, will receive the message.

```javascript
await publisher.publishFormats('test', new WebSocketMessageFormat(body));
```

Finally, it returns a simple success response message and ends.

```javascript
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
