const Grip = require('@fanoutio/grip');
const { Publisher, Format, } = Grip;

// Define a data format.
class ServerSentEventFormat extends Format {
    constructor(message) {
        super();
        this.message = message;
    }
    name() {
        return 'http-stream';
    }
    export() {
        const data = {
            event: 'message',
            data: this.message,
        };
        const content = Object.entries(data)
            .map(([key, value]) => `${key}: ${value.replace('\n', '\\n')}`)
            .join('\n') + '\n\n';
        return { content, };
    }
}

const [
    ,
    ,
    channel,
    message,
    uri,
    iss,
    key,
] = process.argv;

console.log( 'Channel', channel );
console.log( 'Message', message );
console.log( 'Publish URI', uri );
console.log( 'Claim ISS (realm id)', iss );
console.log( 'Claim Key (realm key)', key );

const config = {
    control_uri: uri,
};
if (iss != null && iss !== '') {
    config.control_iss = iss;
}
if (key != null && key !== '') {
    config.key = Buffer.from(key, 'base64');
}

// Instantiate PubControl publisher.
const pub = new Publisher(config);

// Publish across all configured endpoints.
pub.publishFormats(channel, new ServerSentEventFormat(message))
    .then(() => {
        console.log('Publish successful!');
    })
    .catch(({message, context}) => {
        console.log('Publish failed!');
        console.log('Message: ' + message);
        console.log('Context: ');
        console.log(JSON.stringify(context, null, 4));
    });
