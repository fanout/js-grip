import assert from "assert";

import PubControl, { IItem } from '@fanoutio/pubcontrol';
const { Item, PubControlClient } = PubControl;

import GripPubControl from "../src/engine/GripPubControl";
import HttpResponseFormat from "../src/data/http/HttpResponseFormat";
import HttpStreamFormat from "../src/data/http/HttpStreamFormat";

describe('GripPubControl', function () {
    describe('Initialize', function () {
        it('allows for creation of empty GripPubControl object', function () {
            const pubControl = new GripPubControl();
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 0);
        });
        it('allows for creation of GripPubControl object based on single input', function () {
            const pubControl = new GripPubControl({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
        });
        it('allows for creation of GripPubControl object based on multiple inputs', function () {
            const pubControl = new GripPubControl([
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
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 2);
            assert.equal(pc.clients[0].uri, 'uri2');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss2');
            assert.equal(pc.clients[0].auth.key, 'key==2');
            assert.equal(pc.clients[1].uri, 'uri3');
            assert.equal(pc.clients[1].auth.claim['iss'], 'iss3');
            assert.equal(pc.clients[1].auth.key, 'key==3');
        });
    });
    describe('#applyGripConfig', function () {
        it('allows for appending additional configs', function () {
            let pubControl = new GripPubControl();
            pubControl.applyGripConfig({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            assert.equal(pc.clients[0].uri, 'uri');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
            assert.equal(pc.clients[0].auth.key, 'key==');
            pubControl.applyGripConfig([
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
        });
    });
    describe('#removeAllClients', function () {
        it('allows removal of all clients', function () {
            let pubControl = new GripPubControl({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            pubControl.removeAllClients();
            assert.equal(pc.clients.length, 0);
        });
    });
    describe('#addClients', function () {
        it('allows adding of a client', function () {
            let pubControl = new GripPubControl({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            pubControl.addClient(new PubControlClient('uri'));
            assert.equal(pc.clients.length, 2);
        });
    });
    describe('#applyConfig', function () {
        it('allows for appending additional (non-grip) configs', function () {
            let pubControl = new GripPubControl();
            pubControl.applyConfig({
                'uri': 'uri',
                'iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            assert.equal(pc.clients[0].uri, 'uri');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
            assert.equal(pc.clients[0].auth.key, 'key==');
            pubControl.applyConfig([
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
        });
    });
    describe('#publish', function () {
        it('makes sure that publish callback is called.', function (done) {
            let pc = new GripPubControl();
            pc.publish('chan', 'item' as unknown as IItem, () => {
                done();
            });
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            let wasCallbackCalled = false;
            let pc = new GripPubControl();
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await pc.publish('chan', 'item' as unknown as IItem, () => {
                wasCallbackCalled = true;
            });
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
                assert(wasCallbackCalled);
            });
        });
    });
    describe('#publishHttpResponse', function () {
        it('makes sure that publish callback is called.', function (done) {
            const pc = new GripPubControl();
            pc.publishHttpResponse('chan', 'message', () => {
                done();
            });
        });
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const pc = new GripPubControl();
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat('1', '2', '3',
                            '4'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            });
            await pc.publishHttpResponse('chan', new HttpResponseFormat(
                '1', '2', '3', '4'));
            assert(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            let wasCallbackCalled = false;
            const pc = new GripPubControl();
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
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
        });
    });
    describe('#publishHttpStream', function () {
        it('makes sure that publish callback is called.', function (done) {
            const pc = new GripPubControl();
            pc.publishHttpStream('chan', 'message', () => {
                done();
            });
        });
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const pc = new GripPubControl();
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat('1'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            });
            await pc.publishHttpStream('chan', new HttpStreamFormat(
                '1'));
            assert(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            let wasCallbackCalled = false;
            const pc = new GripPubControl();
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            // @ts-ignore
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
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
        });
    });
});
