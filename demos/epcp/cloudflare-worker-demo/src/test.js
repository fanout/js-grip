import { Publisher } from "@fanoutio/grip";

const defaultOpts = {
    uri: "http://api.webhookinbox.com/i/K1BiRnDW/in/",
    iss: "testPubControl defaultOpts Issuer",
    key: Buffer.from("testPubControl defaultOpts realmKey", "base64"),
    defaultChannel: "testPubcontrol defaultOpts defaultChannel"
};

export const testPubcontrol = async (opts = {}) => {
    const o = {
        ...defaultOpts,
        ...opts
    };
    console.log("testPubcontrol", o);
    return await testFromReadme(o);
};

async function testFromReadme({ uri, iss, key, defaultChannel }) {
    // const pub = new Publisher({
    //   'control_uri': 'https://api.fanout.io/realm/<myrealm>',
    //   'control_iss': '<myrealm>',
    //   'key': Buffer.from('<myrealmkey', 'base64')
    // });
    key = key != null ? Buffer.from(key, 'base64') : key;
    const pub = new Publisher({ control_uri: uri, control_iss: iss, key });
    // var pubclient = new PubControlClient('<myendpoint_uri>');
    // // Optionally set JWT auth: pubclient.setAuthJwt(<claim>, '<key>');
    // // Optionally set basic auth: pubclient.setAuthBasic('<user>', '<password>');
    // pub.addClient(pubclient);

    // Publish across all configured endpoints:
    try {
        await pub.publishHttpResponse(defaultChannel, "Test Publish!\n");
        console.log("Publish successful!");
        return {
            message: "Publish successful!",
        };
    } catch (error) {
        const { message, context } = error;
        console.error("Error publishing", error);
        console.log("Publish failed!");
        console.log("Message: " + message);
        console.log("Context: ");
        console.dir(context);
        throw error;
    }
}
