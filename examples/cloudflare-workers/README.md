# Examples for Cloudflare Workers

The examples in this directory illustrate the use of GRIP using
a [Cloudflare Workers](https://workers.cloudflare.com) application as the backend.

* [`http-stream/`](./http-stream) - HTTP streaming using GRIP.
* [`websocket/`](./websocket) - WebSocket-over-HTTP using GRIP.

For details on each example, view the `README` file in its
respective directory.

## Running the examples locally

Each example can be run locally by running it alongside an instance of
[Pushpin](https://pushpin.org/).

To run the examples locally, you'll need:

* Wrangler (Cloudflare Workers CLI) - [installation instructions](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
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
npm install
```

4. Start the example:

```
npm run start
```

This will invoke Wrangler (Cloudflare Workers CLI) to start the local
server to run the example application.

5. Go on to follow the steps under each example's `README` file.

## Description of common code between the examples

Each example has the same general structure:
* Setting up the request handler
* Configuring GRIP and instantiating the `Publisher`
* Checking GRIP status
* Handling (specific to the example)

### The request handler

Following the format of [Cloudflare Workers](https://developers.cloudflare.com/workers/)
applications, these examples declare a default export of  the `addEventHandler` function to declare the `fetch` event handler.

```typescript
addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest({request}) {
    const requestUrl = new URL(request.url);

    // handler code ...
};
```

### Configuration of GRIP

Each example interfaces with GRIP using the `Publisher` class.

To configure `Publisher`, a GRIP configuration object `gripConfig` is used.
The example applications give it a default value of `http://127.0.0.1:5561/` to point to
local Pushpin.

```typescript
let gripConfig: string | IGripConfig = 'http://127.0.0.1:5561/';
```

It may be overridden using a `GRIP_URL`, which in the Cloudflare Workers backend application is set as
an [Secret](https://developers.cloudflare.com/workers/configuration/secrets/). Secrets are read as
[environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/).
Additionally, in the example, the utility function `parseGripUri` is used to merge in the `GRIP_VERIFY_KEY`
if it's required by the proxy.

```typescript
let gripConfig: string | IGripConfig = 'http://127.0.0.1:5561/';
const gripUrl = env.GRIP_URL;
if (gripUrl) {
    gripConfig = parseGripUri(gripUrl, { 'verify-key': env.GRIP_VERIFY_KEY });
}
```

Alternatively, the values for `FANOUT_SERVICE_ID` and `FANOUT_API_TOKEN` are checked, and if present,
they are used with the `buildFanoutGripConfig()` function to build the `gripConfig`.

```typescript
const fanoutServiceId = env.FANOUT_SERVICE_ID;
const fanoutApiToken = env.FANOUT_API_TOKEN;
if (fanoutServiceId != null && fanoutApiToken != null) {
    gripConfig = buildFanoutGripConfig({
        serviceId: fanoutServiceId,
        apiToken: fanoutApiToken,
    });
}
```

These environment variables are typed earlier in the file:

```typescript
export interface Env {
	GRIP_URL?: string,
	GRIP_VERIFY_KEY?: string,
	FANOUT_SERVICE_ID?: string,
	FANOUT_API_TOKEN?: string,
}
```

Finally, this `gripConfig` is used to instantiate `Publisher`.

```typescript
const publisher = new Publisher(gripConfig);
```

In the Cloudflare Workers example, this initialization happens inside the request handler,
because environment variables can only be accessed during the handling of requests.

### GRIP status

The backend application is intended to be called via a GRIP proxy. When the handler runs,
a GRIP proxy will have inserted a `Grip-Sig` header into the request, which it has
signed with a secret or key.

The request handler calls `publisher.validateGripSig` to validate this header,
storing the result in the `gripStatus` variable.
```typescript
const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));
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

A catch-all at the end of the handler handles unhandled requests with a 404 Not
Found error.

Refer to the README in each project for details on how to work with the example.

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

One simple way to do this is to host the example backend in a free
[Cloudflare](https://dash.cloudflare.com/sign-up/workers-and-pages) account,
and then set up a Fastly service with a
[free trial of Fanout](https://www.fastly.com/documentation/guides/concepts/real-time-messaging/fanout/#enable-fanout).

### Setting up Fastly and the Fanout Forwarding starter kit

The following steps describe the process of setting up the
[Fastly Fanout Forwarding Starter Kit (JavaScript)](https://github.com/fastly/compute-starter-kit-javascript-fanout-forward#readme)
on your Fastly account.

1. If you don't already have a Fastly account, sign up for [a free developer account](https://www.fastly.com/signup).

2. Create a new API token (personal access token) that has `global` scope for your
   account.

3. If you haven't already installed the Fastly CLI, [install it](https://www.fastly.com/documentation/reference/tools/cli/).

4. Set up the Fastly CLI with a [user profile](https://www.fastly.com/documentation/reference/tools/cli/#configuring),
   using your API token from above.

5. Create a new directory where you will set up Fastly Fanout Forwarding, and switch to the
   directory.

```
mkdir fastly-fanout-forward
cd fastly-fanout-forward
```

6. Initialize the directory as a Fastly Compute application. Provide a name for the application, a description, and
   author info.

```
fastly compute init --from=https://github.com/fastly/compute-starter-kit-javascript-fanout-forward
```

7. Deploy the application to your Fastly account.

```
fastly compute publish --status-check-off
```

* You will be asked whether you want to create a new service. Reply `y`. Provide the following values:
    * **Service name**: Use the default value, or provide a name that you like.
    * **Domain**: Use the default value, or choose a subdomain of **edgecompute.app** that you like.
    * **Backend**: For now, do not specify any backends.
* Your service will be packaged and deployed to a new service.
    * Make a note of the new service's ID (You'll need it to configure the publisher in the next section).

8. You'll come back to Fastly to set up Fanout and origin host later.

### Setting up the example (backend) code

Follow the steps provided by [Cloudflare Workers's startup guide](https://developers.cloudflare.com/workers/get-started/guide/)
to set up your code to be deployed to Cloudflare's platform.

You'll want to deploy and keep in mind the following:

* You need to set up the [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) needed by your
   Cloudflare Workers application to configure the `Publisher`.

   You may either provide `FANOUT_SERVICE_ID` and `FANOUT_API_TOKEN`, or `GRIP_URL` and `GRIP_VERIFY_KEY`.

     1. Using `FANOUT_SERVICE_ID` and `FANOUT_API_TOKEN`:
        * `FANOUT_SERVICE_ID` - Set this to your Fastly service ID.
        * `FANOUT_API_TOKEN` - Set this to your Fastly API token.
     2. Using `GRIP_URL`:
        * `GRIP_URL` - Set this to `'https://api.fastly.com/service/<SERVICE_ID>?key=<FASTLY_API_TOKEN>&verify-iss=fastly:<SERVICE_ID>'`.
            * Replace both instances of `<SERVICE_ID>` in the URL with your Fastly service ID.
            * Replace `<FASTLY_API_TOKEN>` in the URL with your Fastly API token.
            * Don't forget to put single quotes around the whole thing, so that Glitch can treat the colon and ampersand literally.
        * `GRIP_VERIFY_KEY` - Set this to the value `{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg\",\"y\":\"7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M\"}`

* You'll need to note the Public domain name of your Cloudflare Workers application. Public domain names given by Cloudflare may
   look something like this: `<name>.<zone>.workers.dev`.

### Enable Fanout on your Fastly service, and point it at your backend

1. Switch back to the terminal window where you deployed your Fastly Fanout Forwarding service.

2. Type the following command to add the example application to your Fastly service as a backend with the name `origin`.
   Insert the public hostname of your example backend in the command below.

```
fastly backend create --autoclone --version=active --name=origin --address=<example public hostname>    
```

3. Activate the newly created version.

```
fastly service-version activate --version=latest
```

4. Enable Fanout on your service.

```
fastly products --enable=fanout
```
5. Wait a moment for the updates to deploy across Fastly's network.

6. Go on to follow the steps under each example's `README` file.

When you do this, access the application at your Fastly service's domain name (e.g., `https://<something>.edgecompute.app/`)
instead of your local Pushpin address.

Back to [examples](../)
