# Examples for Fastly Compute

The examples in this directory illustrate the use of GRIP using
[Fastly Compute](https://www.fastly.com/documentation/guides/compute/javascript/) as the backend.

* [`http-stream/`](./http-stream) - HTTP streaming using GRIP.
* [`websocket/`](./websocket) - WebSocket-over-HTTP using GRIP.

For details on each example, view the `README` file in its
respective directory.

## Running the examples locally

Each example can be run locally in the [local development server](https://www.fastly.com/documentation/guides/compute/testing/#running-a-local-testing-server)
alongside an instance of [Pushpin](https://pushpin.org/).

To run the examples locally, you'll need:

* Node.js 16.0 or newer (to build the example)
* Fastly CLI - [installation instructions](https://www.fastly.com/documentation/reference/tools/cli/)
* Pushpin - [installation instructions](https://pushpin.org/docs/install/)

> NOTE: Instead of local Pushpin, you can also run the examples using Fastly Fanout for the GRIP proxy.
See [Running the examples on Fastly Fanout](#running-the-examples-with-fastly-fanout-as-the-grip-proxy) below.

1. Set up Pushpin by modifying the `routes` file with the following content
   (See [this page](https://pushpin.org/docs/configuration/) for details on
   Pushpin configuration):

```
* localhost:3000
```

2. Start Pushpin.

```
pushpin
```

By default, it will listen on port 7999, with a publishing
endpoint open on port 5561. Leave Pushpin running in that terminal window.

3. In a new terminal window, switch to this example's directory, and
   install dependencies:

```
npm install
```

4. Start the example:

```
npm run start
```

This will invoke the Fastly CLI to start the example application in the
local development server.

5. Go on to follow the steps under each example's `README` file.

For local development, configuration values (backend, Secret Store) have been
pre-set in the [`fastly.toml` Compute package manifest](https://www.fastly.com/documentation/reference/compute/fastly-toml/)
file.

# Description of common code between the examples

Each example has the same general structure:
* Setting up the request handler
* Configuring GRIP and instantiating the `Publisher`
* Checking GRIP status
* Handling (specific to the example)

## The request handler

As [do all Compute JavaScript](https://www.fastly.com/documentation/guides/compute/javascript/#main-interface)
applications, these examples use the `addEventHandler` function to declare the `fetch` event handler.

```javascript
addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
    const request = event.request;
    const requestUrl = new URL(event.request.url);

    // handler code ...
};
```

## Configuration of GRIP

Each example interfaces with GRIP using the `Publisher` class. The Compute backend
application instantiates the `Publisher` class using a `GRIP_URL` value set in
a Fastly [Secret Store](https://docs.fastly.com/en/guides/working-with-secret-stores).
A Secret Store is used, because the GRIP_URL may contain secrets or API tokens.

In the examples, the utility function `parseGripUri` is used to merge in the
`GRIP_VERIFY_KEY` if it's required by the proxy (as is the case when using Fastly Fanout
for the GRIP proxy).

In the Compute example, this initialization happens inside the request handler,
because the Secret Store can only be consulted during the handling of messages,
not during application initialization.

The name of the Secret Store depends on the example. In the following example, the
settings are read from the Secret Store named `fastly_http_stream_config`.
```javascript
const secretStore = new SecretStore('fastly_http_stream_config');
const gripUrl = (await secretStore.get('GRIP_URL'))?.plaintext() ?? 'http://localhost:5561/';
const gripVerifyKey = (await secretStore.get('GRIP_VERIFY_KEY')).plaintext();
const gripConfig = parseGripUri(gripUrl, { 'verify-key': gripVerifyKey });
```

Once the configuration is read, it's used to instantiate the `Publisher` class.
```javascript
const publisher = new Publisher(gripConfig, {
    fetch(input, init) {
        return fetch(String(input), { ...init, backend: 'publisher' });
    },
});
```

The `Publisher` class constructor accepts an optional second parameter that is used
to customize its behavior. By default, publishing messages through the `Publisher`
class uses the [global `fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
function as the underlying mechanism. By providing a value for `fetch`, we are able to
override this behavior.

In Compute, a backend needs to be specified to make outgoing `fetch` calls, so the
example assigns the backend called `'publisher'` before calling the global fetch.

## GRIP status

The example application is intended to be called via a GRIP proxy. When the handler
runs, a GRIP proxy will have inserted a `Grip-Sig` header into the request, which it has
signed with a secret or key.

The request handler calls `publisher.validateGripSig` to validate this header,
storing the result in the `gripStatus` variable.
```javascript
const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));
```

This result can be checked for three fields:
`gripStatus.isProxied` - When `true`, indicates that the current request is behind
  a GRIP proxy. If `needsSigned` is `true`, then this will only be `true` if the
  signature validation has also succeeded.
`gripStatus.needsSigned` - When `true`, indicates that the GRIP proxy specified in the
  configuration signs incoming requests.
`gripStatus.isSigned` - When `true`, indicates that the signature validation was successful.

## Handling the request

Following this, the request handler in each example handles the request in its
respective way. Refer to the README in each project for details.

A catch-all at the end of the handler handles unhandled requests with a 404 Not
Found error.

Refer to the README in each project for details on how to work with the example.

# Running the examples with Fastly Fanout as the GRIP proxy

By running these examples on your actual Fastly service, they can be run behind
[Fastly Fanout](https://docs.fastly.com/products/fanout) to benefit from a global
network and holding client connections at the edge.

To do this, you can use [a free Fastly developer account](https://www.fastly.com/signup),
and then set up a [free trial of Fanout](https://www.fastly.com/documentation/guides/concepts/real-time-messaging/fanout/#enable-fanout).

Note that this means there will be two Fastly services:
* One to run the example application.
* One to forward requests through Fanout to the example application.

### Setting up the Fanout Forwarding starter kit

First, set up the Fastly service that will forward requests through Fanout.

The following steps use the [Fastly Cloud Deploy](https://www.fastly.com/documentation/reference/tools/cloud-deploy/)
tool and the Web UIs to set up a Fastly account and service.

> TIP: If you are familiar with the [Fastly CLI](https://www.fastly.com/documentation/reference/tools/cli/),
then you can use it instead to perform them manually, if you like.

1. If you don't already have a Fastly account, sign up for [a free developer account](https://www.fastly.com/signup).

2. Create a new API token (personal access token) that has `global` scope for your
   account.

3. Browse to the [Fastly Fanout Forwarding Starter Kit (JavaScript)](https://github.com/fastly/compute-starter-kit-javascript-fanout-forward#readme)
   in your web browser.

4. In the `README` file, and click the _Deploy to Fastly_ button. You'll be taken to the **Cloud Deploy** tool. Then:
    1. Step 1 - Provide your credentials to log in to GitHub
    2. Step 2 - Provide your Fastly API token.
    3. Step 3 - You'll be asked to provide a repository name at which to fork the starter kit.
    4. Step 4 - You'll be given a service ID. Note the service ID, and then click _Deploy_.
    5. You'll be taken to a progress screen that lists your new Fastly service's domain name and service ID.

5. As the deployment proceeds, you may continue with the following steps to set up the example backend code.
   You'll come back to this service to set up Fanout and origin host later.

### Setting up the example (backend) code

The steps below describe how to deploy each example to a new service in your Fastly account.

1. If you haven't installed the Fastly CLI, [install it](https://www.fastly.com/documentation/reference/tools/cli/).
2. Set up the Fastly CLI with a [user profile](https://www.fastly.com/documentation/reference/tools/cli/#configuring).
3. Switch to the example's directory.
4. Install the example's dependencies
   ```
   npm install
   ```
5. Publish this to a Fastly service
   ```
   npm run deploy
   ```
   * Because there is no Fastly service associated with the package, you'll be asked if
     you'd like to create a new service. Reply **y** (for yes). Provide the following values:
     * **Service-name**: Use the default value, or provide a name that you like
     * **Domain**: Use the default value, or choose a subdomain of **edgecompute.app** that you like
     * **Backend**: Enter one backend:
       * Backend (hostname or IP address): **api.fastly.com**
       * Backend port number: Use the default value of **443**
       * Backend name: **publisher**
       * Do not enter any more backends
     * **Secret Stores**: you will be asked to provide values for the Secret Store values. The values will not be displayed
       as you enter them. 
       * `GRIP_URL` - Set this to `https://api.fastly.com/service/<SERVICE_ID>?key=<FASTLY_API_TOKEN>&verify-iss=fastly:<SERVICE_ID>`.
         * Replace both cases of `<SERVICE_ID>` in the URL with the service ID of the Fastly Forwarding service.
         * Replace `<FASTLY_API_TOKEN>` in the URL with your Fastly API token.
       * `GRIP_VERIFY_KEY` - Set this to the value `{"kty":"EC","crv":"P-256","x":"CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg","y":"7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M"}`

### Enable Fanout on your Fastly Forwarding service, and point it at your backend

1. Visit the management page for the Fastly Forwarding service.
  * The URL looks something like this: `https://manage.fastly.com/configure/services/<SERVICE_ID>`

2. Click the Edit Configuration button and then click "Clone to edit".

3. Set up your Fastly service with a **Origin Host** that points to your backend.
  * In the editor, navigate to **Origin** > **Hosts**
  * Use the public domain of your backend that you specified when you deployed it.
  * After you add the domain name, edit the host and set the name to the string `origin`.
  * Make sure it's set up with the right port number.
  * Scroll down, and set the **Override host** value to the domain as well.
  * Click **Update**

4. Enable Fanout on your service.
  * In the editor, navigate to **Settings** > **Fanout**
  * Click the ON/OFF switch to enable Fanout on your service.

5. Activate this new version.
  * Scroll up and click the **Activate** button.

6. Wait a moment for the updated version to deploy across Fastly's network.

7. Go on to follow the steps under each example's `README` file.

When you do this, access the application at your Fastly service's domain name
instead of your local Pushpin address.

Back to [examples](../)
