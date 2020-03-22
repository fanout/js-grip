// DEMO - Publishes test message to backend running behind Pushpin.
// See README.md for directions on running this demo.
const { GripPubControl } = require('..');

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

// Instantiate GripPubControl publisher.
const config = {
    control_uri: uri,
};
const pub = new GripPubControl(config);

// Publish across all configured endpoints.
pub.publishHttpStream( channel, message + '\n' )
    .then(() => {
        console.log('Publish successful!');
    })
    .catch(({message, context}) => {
        console.log('Publish failed!');
        console.log('Message: ' + message);
        console.log('Context: ');
        console.log(JSON.stringify(context, null, 4));
    });
