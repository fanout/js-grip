var grip = require('@fanout/grip');

var callback = function(success, message, context) {
    if (success) {
        console.log('Publish successful!');
    }
    else {
        console.log("Publish failed!");
        console.log("Message: " + message);
        console.log("Context: ");
        console.dir(context);
    }
};

// Publisher can be initialized with or without an endpoint configuration.
// Each endpoint can include optional JWT authentication info.
// Multiple endpoints can be included in a single configuration.

var grippub = new grip.Publisher({
        'control_uri': 'https://api.fanout.io/realm/<myrealm>',
        'control_iss': '<myrealm>',
        'key': Buffer.from('<myrealmkey>', 'base64')});

// Add new endpoints by applying an endpoint configuration:
grippub.applyGripConfig([{'control_uri': '<myendpoint_uri_1>'},
        {'control_uri': '<myendpoint_uri_2>'}]);

// Remove all configured endpoints:
grippub.removeAllClients();

// Explicitly add an endpoint as a PublisherClient instance:
var pubclient = new grip.PublisherClient('<myendpoint_uri>');
// Optionally set JWT auth: pubclient.setAuthJwt(<claim>, '<key>');
// Optionally set basic auth: pubclient.setAuthBasic('<user>', '<password>');
grippub.addClient(pubclient);

// Publish across all configured endpoints:
grippub.publishHttpResponse('<channel>', 'Test Publish!', callback);
grippub.publishHttpStream('<channel>', 'Test Publish!', callback);
