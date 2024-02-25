# Examples for Node.js

The examples in this directory illustrate the use of GRIP using
Node.js as the backend.

* [`http-stream/`](./http-stream) - HTTP streaming using GRIP.
* [`websocket/`](./websocket) - WebSocket-over-HTTP using GRIP.

For details on each example, view the `README` file in its
respective directory.

## Running the examples locally

Each example can be run locally by running it alongside an instance of
[Pushpin](https://pushpin.org/).

To run the examples locally, you'll need:

* Node.js 16.0 or newer
  * If you use Node.js 16.15 or newer, then the `isomorphic-fetch` dependency
    can be removed. 
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

This will run Node.js to start the example application.

5. Go on to follow the steps under each example's `README` file.

# Description of common code between the examples

Each example has the same general structure:
* Configuring GRIP and instantiating the `Publisher`
* Setting up the request handler and checking GRIP status
* Handling (specific to the example)
* Starting the server

## Configuration of GRIP

Each example interfaces with GRIP using the `Publisher` class. The Node.js backend
application instantiates the `Publisher` class using a `GRIP_URL` set as an
environment variable.

In the examples, the utility function `parseGripUri` is used to merge in the
`GRIP_VERIFY_KEY` if it's required by the proxy (as is the case when using Fastly Fanout for the GRIP proxy).

In the Node.js example, this initialization happens outside the request handler because the
single `Publisher` instance can be reused across incoming requests.

```javascript
const gripURL = process.env.GRIP_URL ?? 'http://localhost:5561/';
const gripVerifyKey = process.env.GRIP_VERIFY_KEY;
const gripConfig = parseGripUri(gripURL, { 'verify-key': gripVerifyKey });
const publisher = new Publisher(gripConfig);
```

## The request handler and GRIP status

Then the application calls `http.createServer` to start the HTTP server and set up a request handler.

```javascript
const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, (req.socket.encrypted ? 'https://' : 'http://') + req.headers['host']);

    // handler code ...
});
```

The backend application is intended to be called via a GRIP proxy. When the handler runs,
a GRIP proxy will have inserted a `Grip-Sig` header into the request, which it has
signed with a secret or key.

The request handler calls `publisher.validateGripSig` to validate this header,
storing the result in the `gripStatus` variable.
```javascript
  const gripStatus = await publisher.validateGripSig(req.headers['grip-sig']);
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

## Starting the server

After the request handler has been declared, the Node.js application starts the
server, which begins listening on port 3000.

```javascript
server.listen(3000, '0.0.0.0');
console.log('Server running...');
```

Refer to the README in each project for details on how to work with the example.

# Running the examples with Fastly Fanout as the GRIP proxy

By running these examples at a public address, they can also be run behind
[Fastly Fanout](https://docs.fastly.com/products/fanout) to benefit from a global
network and holding client connections at the edge.

One simple way to do this is to host the example backend in a free
[Glitch](https://glitch.com) account, and then set up a Fastly service with a
[free trial of Fanout](https://www.fastly.com/documentation/guides/concepts/real-time-messaging/fanout/#enable-fanout).

### Setting up Fastly and the Fanout Forwarding starter kit

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
   You'll come back to Fastly to set up Fanout and origin host later.

### Setting up the example (backend) code

The steps below are for Glitch, but you may run the example code on any publicly accessible Node.js server.

1. If you don't already have a Glitch account, [sign up for a free account](https://glitch.com/signin).
2. Start a new project with the `glitch-hello-node` template.
    * Your project will be created with a project ID, which will look like several random words strung
      together with hyphens.
    * Keep a note of your public URL, which is `<random-words>.glitch.me`.
3. Remove the existing files in the project, and copy the files from the example into it.
4. Modify the `.env` file in your project to set up `GRIP_URL` and `GRIP_VERIFY_URL` with these values:
  * `GRIP_URL` - Set this to `'https://api.fastly.com/service/<SERVICE_ID>?key=<FASTLY_API_TOKEN>&verify-iss=fastly:<SERVICE_ID>'`.
    * Replace both cases of `<SERVICE_ID>` in the URL with your Fastly service ID.
    * Replace `<FASTLY_API_TOKEN>` in the URL with your Fastly API token.
    * Don't forget to put single quotes around the whole thing, so that Glitch can treat the colon and ampersand literally.
  * `GRIP_VERIFY_KEY` - Set this to the value `{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"CKo5A1ebyFcnmVV8SE5On-8G81JyBjSvcrx4VLetWCg\",\"y\":\"7gwJqaU6N8TP88--twjkwoB36f-pT3QsmI46nPhjO7M\"}`

You're free to use any other platform as well so long as it runs Node.js 16 or newer. If you do this, make sure that:
  * Make sure that your application has a public URL that is available over `https`.
  * You have set the environment variables as listed above.
  * You start the application with `npm run start`.

### Enable Fanout on your Fastly service, and point it at your backend

1. Visit your Fastly service's management page.
  * The URL looks something like this: `https://manage.fastly.com/configure/services/<SERVICE_ID>`

2. Click the Edit Configuration button and then click "Clone to edit".

3. Set up your Fastly service with a **Origin Host** that points to your backend.
  * In the editor, navigate to **Origin** > **Hosts**
  * Use the public domain of your backend.
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
