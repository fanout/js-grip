const { Publisher, PublishException } = require('@fanoutio/grip');

// Publisher can be initialized with or without an endpoint configuration.
// Each endpoint can include optional JWT authentication info.
// Multiple endpoints can be included in a single configuration.

const publisher = new Publisher({
    'control_uri': 'https://api.fanout.io/realm/<myrealm>',
    'control_iss': '<myrealm>',
    'key': Buffer.from('<myrealmkey>', 'base64'),
});

// Add additional endpoints by applying an endpoint configuration:
publisher.applyGripConfig([
    {'control_uri': '<myendpoint_uri_1>'},
    {'control_uri': '<myendpoint_uri_2>'},
]);

// Publish across all configured endpoints.
// The publish methods return a promise that resolves to a void value.
// If the publish fails, they reject with an PublishException object.

try {
    await publisher.publishHttpResponse('<channel>', 'Test Publish!');
    console.log('Publish successful!');
} catch(ex) {
    if (ex instanceof PublishException) {
        console.log("Publish failed!");
        console.log("Message: " + ex.message);
        console.log("Context: ");
        console.dir(ex.context);
    } else {
        throw ex;
    }
}

try {
    await publisher.publishHttpStream('<channel>', 'Test Publish!');
    console.log('Publish successful!');
} catch(ex) {
    if (ex instanceof PublishException) {
        console.log("Publish failed!");
        console.log("Message: " + ex.message);
        console.log("Context: ");
        console.dir(ex.context);
    } else {
        throw ex;
    }
}
