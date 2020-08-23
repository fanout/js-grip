// DEMO - Server for js-grip demo
const http = require('http');
const { GripInstruct } = require('../..');

const port = 3000;

const server = http.createServer((req, res) => {

    const instruct = new GripInstruct('test');
    instruct.setHoldStream();
    const headers = instruct.toHeaders();

    res.writeHead(200, Object.assign({
        'Content-Type': 'text/plain'
    }, headers));

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
