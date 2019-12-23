import assert from "assert";

import { Format, Item, PubControlClient } from '@fanoutio/pubcontrol';

import GripPubControl from "../esm/engine/GripPubControl.mjs";
import HttpResponseFormat from "../esm/data/http/HttpResponseFormat.mjs";
import HttpStreamFormat from "../esm/data/http/HttpStreamFormat.mjs";

class TestFormat extends Format {
    constructor(body) {
        super();
        this.body = body;
    }

    name() {
        return 'testformat';
    }

    export() {
        return {'body': this.body};
    }
}

const TestItem = new Item();

(function testInitialize() {
    let pc = new GripPubControl();
    assert.equal(pc.clients.length, 0);
    pc = new GripPubControl({
        'control_uri': 'uri',
        'control_iss': 'iss',
        'key': 'key==',
    });
    assert.equal(pc.clients.length, 1);
})();

(function testApplyGripConfig() {
    let pc = new GripPubControl();
    pc.applyGripConfig({
        'control_uri': 'uri',
        'control_iss': 'iss',
        'key': 'key==',
    });
    assert.equal(pc.clients.length, 1);
    assert.equal(pc.clients[0].uri, 'uri');
    assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.clients[0].auth.key, 'key==');
    pc.applyGripConfig([
        {
            'control_uri': 'uri2',
            'control_iss': 'iss2',
            'key': 'key==2',
        },
        {
            'control_uri': 'uri3',
            'control_iss': 'iss3',
            'key': 'key==3',
        },
    ]);
    assert.equal(pc.clients.length, 3);
    assert.equal(pc.clients[0].uri, 'uri');
    assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.clients[0].auth.key, 'key==');
    assert.equal(pc.clients[1].uri, 'uri2');
    assert.equal(pc.clients[1].auth.claim['iss'], 'iss2');
    assert.equal(pc.clients[1].auth.key, 'key==2');
    assert.equal(pc.clients[2].uri, 'uri3');
    assert.equal(pc.clients[2].auth.claim['iss'], 'iss3');
    assert.equal(pc.clients[2].auth.key, 'key==3');
})();

(function testRemoveAllClients() {
    let pc = new GripPubControl({
        'control_uri': 'uri',
        'control_iss': 'iss',
        'key': 'key==',
    });
    assert.equal(pc.clients.length, 1);
    pc.removeAllClients();
    assert.equal(pc.clients.length, 0);
})();

(function testAddClient() {
    let pc = new GripPubControl({
        'control_uri': 'uri',
        'control_iss': 'iss',
        'key': 'key==',
    });
    assert.equal(pc.clients.length, 1);
    pc.addClient(new PubControlClient('uri'));
    assert.equal(pc.clients.length, 2);
})();

(function testApplyConfig() {
    let pc = new GripPubControl();
    pc.applyConfig({
        'uri': 'uri',
        'iss': 'iss',
        'key': 'key==',
    });
    assert.equal(pc.clients.length, 1);
    assert.equal(pc.clients[0].uri, 'uri');
    assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.clients[0].auth.key, 'key==');
    pc.applyConfig([
        {
            'uri': 'uri2',
            'iss': 'iss2',
            'key': 'key==2',
        },
        {
            'uri': 'uri3',
            'iss': 'iss3',
            'key': 'key==3',
        },
    ]);
    assert.equal(pc.clients.length, 3);
    assert.equal(pc.clients[0].uri, 'uri');
    assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.clients[0].auth.key, 'key==');
    assert.equal(pc.clients[1].uri, 'uri2');
    assert.equal(pc.clients[1].auth.claim['iss'], 'iss2');
    assert.equal(pc.clients[1].auth.key, 'key==2');
    assert.equal(pc.clients[2].uri, 'uri3');
    assert.equal(pc.clients[2].auth.claim['iss'], 'iss3');
    assert.equal(pc.clients[2].auth.key, 'key==3');
})();

(async function testPublish() {
    let wasPublishCalled = false;
    let pc = new GripPubControl();
    pc.addClient({
        publish: async function (channel, item) {
            assert.equal(item, 'item');
            assert.equal(channel, 'chan');
            wasPublishCalled = true;
        }
    });
    await pc.publish('chan', 'item');
    assert(wasPublishCalled);
})();

(async function testPublishCallback() {
    let publishCalled = 0;
    let wasCallbackCalled = false;
    let pc = new GripPubControl();
    pc.addClient({
        publish: async function (channel, item) {
            assert.equal(item, 'item');
            assert.equal(channel, 'chan');
            publishCalled++;
        }
    });
    pc.addClient({
        publish: async function (channel, item) {
            assert.equal(item, 'item');
            assert.equal(channel, 'chan');
            publishCalled++;
        }
    });
    await pc.publish('chan', 'item', () => {
        wasCallbackCalled = true;
    });
    process.on('beforeExit', () => {
        assert.strictEqual(publishCalled, 2);
        assert(wasCallbackCalled);
    });
})();

(async function testPublishHttpResponse() {
    let wasPublishCalled = false;
    let pc = new GripPubControl();
    pc.addClient({
        publish: async function (channel, item) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpResponseFormat(
                    {body: 'message'}))));
            assert.equal(channel, 'chan');
            wasPublishCalled = true;
        }
    });
    await pc.publishHttpResponse('chan', 'message');
    assert(wasPublishCalled);

    wasPublishCalled = false;
    pc = new GripPubControl();
    pc.addClient({
        publish: function (channel, item, callback) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpResponseFormat('1', '2', '3',
                    '4'))));
            assert.equal(channel, 'chan');
            assert.equal(callback, null);
            wasPublishCalled = true;
        }
    });
    await pc.publishHttpResponse('chan', new HttpResponseFormat(
        '1', '2', '3', '4'));
    assert(wasPublishCalled);
})();

(async function testResponsePublishCallback() {
    let publishCalled = 0;
    let wasCallbackCalled = false;
    const pc = new GripPubControl();
    pc.addClient({
        publish: async function (channel, item) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpResponseFormat(
                    {body: 'message'}))));
            assert.equal(channel, 'chan');
            publishCalled++;
        }
    });
    pc.addClient({
        publish: async function (channel, item, cb) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpResponseFormat(
                    {body: 'message'}))));
            assert.equal(channel, 'chan');
            publishCalled++;
        }
    });
    await pc.publishHttpResponse('chan', 'message', () => {
        wasCallbackCalled = true;
    });
    process.on('beforeExit', () => {
        assert.strictEqual(publishCalled, 2);
        assert(wasCallbackCalled);
    });
})();

(async function testPublishHttpStream() {
    let wasPublishCalled = false;
    let pc = new GripPubControl();
    pc.addClient({
        publish: async function (channel, item, callback) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpStreamFormat('message'))));
            assert.equal(channel, 'chan');
            assert.equal(callback, null);
            wasPublishCalled = true;
        }
    });
    await pc.publishHttpStream('chan', 'message');
    assert(wasPublishCalled);

    wasPublishCalled = false;
    pc = new GripPubControl();
    pc.addClient({
        publish: async function (channel, item, callback) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpStreamFormat('1'))));
            assert.equal(channel, 'chan');
            assert.equal(callback, null);
            wasPublishCalled = true;
        }
    });
    await pc.publishHttpStream('chan', new HttpStreamFormat(
        '1'));
    assert(wasPublishCalled);
})();

(async function testStreamPublishCallback() {
    let publishCalled = 0;
    let wasCallbackCalled = false;
    const pc = new GripPubControl();
    pc.addClient({
        publish: function (channel, item, cb) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpStreamFormat(
                    'message'))));
            assert.equal(channel, 'chan');
            publishCalled++;
        }
    });
    pc.addClient({
        publish: function (channel, item, cb) {
            assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                new HttpStreamFormat(
                    'message'))));
            assert.equal(channel, 'chan');
            publishCalled++;
        }
    });
    await pc.publishHttpStream('chan', 'message', () => {
        wasCallbackCalled = true;
    });
    process.on('beforeExit', () => {
        assert.strictEqual(publishCalled, 2);
        assert(wasCallbackCalled);
    });
})();
