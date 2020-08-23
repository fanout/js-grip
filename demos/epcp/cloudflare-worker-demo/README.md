# js-pubcontrol-demo-webworkers

A demo of running PubControl in a background thread, as a Web Worker.  Web Worker is an API that enables the running of
a JavaScript file in context other than the browser's UI thread.  You may want to use this with PubControl so that the
network calls made by it may occur without affecting the main thread.

In addition to running in a Web Worker, this demo also includes an example of using PubControl in a Cloudflare Worker. 
Cloudflare Workers are a serverless execution environment that enables developers to provide code written in JavaScript
to handle requests.

It's important to note that these two use cases are fundamentally not the same.  In the first you are offloading work to
another thread that employs PubControl.  In the second you are writing a web application that uses PubControl.

In this demo, Webpack is used for two purposes: 
1. Web Workers and Cloudflare Workers are expected to be provided as a single script file. In order to write organized
and reusable source code, it is often written in multiple files and includes references to other modules. Webpack allows
us to "bundle" the relevant parts of all of these source files into a single bundled file. 
2. By using Webpack with Babel, we are able to use modern JavaScript language features in our source code, but have those
transpiled into code that older browsers will understand.

## Running in the browser

In this usage, the browser runs a web worker, which is a small piece of JavaScript designed to run in a separate thread
of execution, to work with PubControl. Web Workers use an event-driven model, where the main thread and worker threads
run in parallel and communicate with each other using message-passing.

See the following for a description of Web Workers and how to use them.
https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

The Web Worker example works by running the bundle `main.js`, whose entry point is `src/index.js`.  This acts as a loader
to start the web worker bundle `pubcontrol-browser-demo.webworker.js`. The browser starts the bundle, whose entry point
is `src/webworker.js`, in a separate thread.  Once the worker has started, it begins listening for messages from the main
thread.

Eventually the main thread sends the web worker a `EPCPConfiguration` message, and this causes the web worker to call
`testPubcontrol` in `src/test.js`, which is what ultimately uses `pubcontrol`.

To run the demo:
```
make server
```

This will use Webpack to build everything into `./dist/`, then run a simple http-server to serve the demo html at
`http://localhost:8091?testPubControl=1&epcp.uri=http://api.webhookinbox.com/i/ljltWgzf/in/`. Go create a fresh webhook
inbox to test your own.

## Cloudflare worker

Cloudflare Workers are a serverless execution environment that allows the authoring of applications that respond to web
requests. The developer is expected to write JavaScript that implements the Service Workers API. Although Service Worker
API is originally an API defined to allow code to be written in the browser to intercept network requests, Cloudflare
Workers is designed using the same API.

See the following for a description of Cloudflare Workers.
https://blog.cloudflare.com/introducing-cloudflare-workers/

The Cloudflare Worker example works by uploading the bundle `pubcontrol-browser-demo.cloudflareworker.js` to Cloudflare.
This bundle's entry point is `src/cloudflare-worker.js`.  This sets up an event listener for the `fetch` event, which
will be triggered for every request to the worker.  This event handler examines the URL of the request, looks for the
`testPubControl` query parameter, and if present, calls `testPubcontrol` in `src/test.js`, which is what ultimately uses
`pubcontrol`. Note that this is the same `src/test.js` that was used in the web worker example. Finally, the handler
returns a message body to the caller, whose result is usually displayed in a web browser.

To run the demo, you will need a Cloudflare account and a domain name.

1. Set up Cloudflare so that it acts as a proxy for requests to your domain name.

2. Set some environment variables.

| variable             | description                                                         |
|--------------------- |-------------------------------------------------------------------- |
| CLOUDFLARE_EMAIL     | email address of your Cloudflare account                            |
| CLOUDFLARE_AUTH_KEY  | API Key for your cloudflare account                                 |
| CLOUDFLARE_ZONE_ID   | Zone ID of your Cloudflare Zone, which corresponds to a domain name |

For example,

```
export CLOUDFLARE_AUTH_KEY=0123456789abcdef0123456789abcdef01234
export CLOUDFLARE_EMAIL=dev@your-domain.com
export CLOUDFLARE_ZONE_ID=0123456789abcdef0123456789abcdef
```

This information is available in the Cloudflare dashboard.  Notably, the zone ID is available on the Overview page for
your domain, in the right-hand column towards the bottom in the API section.

3. Build and upload the Cloudflare Worker
```
make cloudflare-worker-upload
```

4. Create a route to direct traffic to that worker
```
./etc/cloudflare/create-route.sh 'your-domain.com/*'
```

This means that all traffic to `your-domain.com` will be handled by the Cloudflare Worker (instead of being fetched from
the origin).

5. Test

Open 'http://your-domain.com/?testPubControl=1&epcp.uri=http://api.webhookinbox.com/i/ljltWgzf/in/' in a web browser.
