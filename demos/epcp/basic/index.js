// DEMO - Publishes test message to local Pushpin.
// See README.md for directions on running this demo.
const { Publisher, Item, Format } = require('../../..');

// Define a data format.
class HttpStreamFormat extends Format {
    constructor(message) {
        super();
        this.message = message;
    }
    name() {
        return 'http-stream';
    }
    export() {
        return { content: this.message + '\n', };
    }
}

const uri = "http://localhost:5561/";

const [
    ,
    ,
    channel,
    message,
] = process.argv;

console.log( 'Publish URI', uri );
console.log( 'Channel', channel );
console.log( 'Message', message );

// Instantiate PubControl publisher.
const config = {
    uri,
};
const pub = new Publisher(config);

// Publish across all configured endpoints.
const item = new Item(new HttpStreamFormat(message));
pub.publish(channel, item)
    .then(() => {
        console.log('Publish successful!');
    })
    .catch(({message, context}) => {
        console.log('Publish failed!');
        console.log('Message: ' + message);
        console.log('Context: ');
        console.log(JSON.stringify(context, null, 4));
    });
