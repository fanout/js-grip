# GRIP demos

This directory contains some samples and demos of how of

## EPCP

### Basic Publishing Demo

Path: `demos/epcp/basic`

This demo publishes a message using EPCP to the open-source Pushpin
(https://pushpin.org/) server.

To run the demo:

1. Clone this repository, then build the commonjs build of this library
```
pnpm install
pnpm build-package
```

2. Install Pushpin (see https://pushpin.org/docs/install/)

3. Make sure Pushpin has the default test config.

The `routes` file should look like this:
```
* test
```
4. Start Pushpin.
```
pushpin
```
5. In another terminal window, open a long-lived connection to the pushpin stream.
```
curl http://localhost:7999/stream
```
6. In another terminal window, Run the demo
```
node demos/epcp/basic test "Message"
```
7. In the window that you opened in step 5, you should see the test message.

### Node.js Demo

Path: `demos/epcp/node-commonjs-demo`

A demo of using the CommonJS build of PubControl in a Node.js app.

This demo allows you to post a message to Pushpin or to the Fanout Cloud
(the free tier is enough to run this demo).

#### Fanout Cloud

The easiest way to test this demo is to sign up with Fanout Cloud and
use the test page.  You will need the following information
from the Fanout cloud account:

* The Realm ID
* The Realm Key

1. Log in to Fanout Cloud, and then in the Control Panel, click through
to the SSE test page for your account, and then leave this page open in
a browser window.

2. Clone this repository, then build the commonjs build of this library.
```
npm install
npm run build-commonjs
```

3. Run the `index.js` file, passing five parameters:

```bash
node demos/epcp/node-commonjs-demo/index.js <channel> <message> <uri> <iss> <key>
```

For the parameters, provide the following values:
* Channel: `test`
* Message: any message you like, such as `'Hello, World!'`
* Publish URI: http://localhost:5561/ (local Pushpin) or http://api.fanout.io/realm/<realm-id> (Fanout cloud)
* Claim ISS (realm id): Your realm ID (Only required for Fanout cloud)
* Claim Key (realm key): Your realm Key (Only required for Fanout cloud)

For example:
```bash
node demos/epcp/node-commonjs-demo/index.js test 'Hello, World!' http://api.fanout.io/realm/myrealm myrealm PWxplHcjt2bW9wtg0V6zdg==
```

node demos/epcp/node-commonjs-demo/index.js test 'Hello, World!' http://api.fanout.io/realm/pex2 pex2 PWxplHcjt2bW9wtg0V6zdg==

You should see `Publish successful!` as output.

4. Click back to the window with the SSE test page. On the SSE test page, there is
a gray box that is subscribed to the `test` channel.  When you click the publish
button as above, you should see the message that you typed appear in the gray box.

#### Pushpin





### Browser Demo

Path: `demos/epcp/browser-demo`

A demo of using the browser build of PubControl in the browser.

Due to limitations in Pushpin, you will not be able to run this demo
in a web browser against Pushpin directory.  You will have to either proxy
requests to Pushpin, or you may use a Fanout cloud account (the free tier is
enough to run this demo).

#### Fanout Cloud

The easiest way to test this demo is to sign up with Fanout Cloud and
use the test page.  You will need the following information
from the Fanout cloud account:

* The Realm ID
* The Realm Key

1. Log in to Fanout Cloud, and then in the Control Panel, click through
to the SSE test page for your account, and then leave this page open in
a browser window.

2. Clone this repository, then build the browser build of this library.
```
npm install
npm run build-browser
```

3. Then open `demos/epcp/browser-demo/index.html` in a browser.

4. In the form, enter:

* Channel: `test`
* Message: any message you like, such as `Hello, World!`
* Publish URI: http://api.fanout.io/realm/<realm-id>
* Claim ISS (realm id): Your realm ID
* Claim Key (realm key): Your realm Key

Then, click the Publish button.  You should see `Publish successful!` below the Publish
button.

5. Click back to the window with the SSE test page. On the SSE test page, there is
a gray box that is subscribed to the `test` channel.  When you click the publish
button as above, you should see the message that you typed appear in the gray box.

