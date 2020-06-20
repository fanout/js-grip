// DEMO - Server for js-grip demo
const http = require('http');
const { createGripChannelHeader } = require('../..');

const port = 3000;

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        'Grip-Hold': 'stream',
        'Grip-Channel': createGripChannelHeader('test'),
        'Content-Type': 'text/plain',
    });
    res.write("[open stream]\n", () => {
        res.end();
    });

});

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});
