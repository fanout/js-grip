# js-pubcontrol-node-commonjs-demo

A demo of using the CommonJS build of PubControl in a Node.js app.

This demo allows you to post a message to Pushpin or to the Fanout cloud
(the free tier is enough to run this demo).

## Usage

If you are using the Fanout cloud, you will need the following information
from the Fanout cloud account:

* The Realm ID
* The Realm Key

Click through to the SSE test page for your account, and then leave this page
open in a browser window.

In the parent directory, build `js-pubcontrol`.  

Then run `index.js` and pass 5 parameters:

```bash
node index.js <channel> <message> <uri> <iss> <key>
```

For the parameters, provide the following values:
* Channel: `test`
* Message: any message you like, such as `"Hello, World!"`
* Publish URI: http://localhost:5561/ (local Pushpin) or http://api.fanout.io/realm/<realm-id> (Fanout cloud)
* Claim ISS (realm id): Your realm ID (Only required for Fanout cloud)
* Claim Key (realm key): Your realm Key (Only required for Fanout cloud)

e.g.
```bash
node index.js test "Hello, World!" http://api.fanout.io/realm/myrealm myrealm PWxplHcjt2bW9wtg0V6zdg==
```

You should see `Publish successful!` as output.

Click back to the window with the SSE test page. On the SSE test page, there is
a gray box that is subscribed to the `test` channel.  When you click the publish
button as above, you should see the message that you typed appear in the gray box.
