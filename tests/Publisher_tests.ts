import assert from "assert";

import Item from '../src/data/Item';
import IItem from '../src/data/IItem';
import PublisherClient from "../src/engine/PublisherClient";

import Publisher from "../src/engine/Publisher";
import HttpResponseFormat from "../src/data/http/HttpResponseFormat";
import HttpStreamFormat from "../src/data/http/HttpStreamFormat";
import PublishException from "../src/data/PublishException";

describe('Publisher', function () {
    describe('#constructor', function () {
        it('allows for creation of empty Publisher object', function () {
            const pubControl = new Publisher();
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 0);
        });
        it('allows for creation of Publisher object based on single input', function () {
            const pubControl = new Publisher({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
        });
        it('test case', function () {
            const pc = new Publisher({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
        });
        it('allows for creation of Publisher object based on multiple inputs', function () {
            const pubControl = new Publisher([
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
    describe('#applyConfig', function () {
        it('allows for appending additional configs', function () {
            let pubControl = new Publisher();
            pubControl.applyConfig({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            assert.equal(pc.clients[0].uri, 'uri');
            assert.equal(pc.clients[0].auth.claim['iss'], 'iss');
            assert.equal(pc.clients[0].auth.key, 'key==');
            pubControl.applyConfig([
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
        it('test case', function () {
            const pubControl = new Publisher();
            const pc = pubControl as any;
            pubControl.applyConfig({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
            assert.equal(pc.clients[0].uri, "uri");
            assert.equal(pc.clients[0].auth.claim["iss"], "iss");
            assert.equal(pc.clients[0].auth.key, "key==");
            pubControl.applyConfig([
                { uri: "uri2", iss: "iss2", key: "key==2" },
                { uri: "uri3", iss: "iss3", key: "key==3" }
            ]);
            assert.equal(pc.clients.length, 3);
            assert.equal(pc.clients[0].uri, "uri");
            assert.equal(pc.clients[0].auth.claim["iss"], "iss");
            assert.equal(pc.clients[0].auth.key, "key==");
            assert.equal(pc.clients[1].uri, "uri2");
            assert.equal(pc.clients[1].auth.claim["iss"], "iss2");
            assert.equal(pc.clients[1].auth.key, "key==2");
            assert.equal(pc.clients[2].uri, "uri3");
            assert.equal(pc.clients[2].auth.claim["iss"], "iss3");
            assert.equal(pc.clients[2].auth.key, "key==3");
        });
    });
    describe('#removeAllClients', function () {
        it('allows removal of all clients', function () {
            let pubControl = new Publisher({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            pubControl.removeAllClients();
            assert.equal(pc.clients.length, 0);
        });
        it('test case', function () {
            const pc = new Publisher({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
            pc.removeAllClients();
            assert.equal(pc.clients.length, 0);
        });
    });
    describe('#addClients', function () {
        it('allows adding of a client', function () {
            let pubControl = new Publisher({
                'control_uri': 'uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            pubControl.addClient(new PublisherClient('uri'));
            assert.equal(pc.clients.length, 2);
        });
        it('test case', function () {
            const pc = new Publisher({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
            pc.addClient(new PublisherClient("uri"));
            assert.equal(pc.clients.length, 2);
        });
    });
    describe('#applyConfig', function () {
        it('allows for appending additional (non-grip) configs', function () {
            let pubControl = new Publisher();
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
        it('test case', async function () {
            let wasPublishCalled = false;
            const testItem = <Item>{};
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    wasPublishCalled = true;
                }
            });
            await pc.publish("chan", testItem);
            assert(wasPublishCalled);
        });
        it('async', async function() {
            const testItem = <Item>{};
            let calls = 2;
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            pc.addClient(<PublisherClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            await pc.publish("chan", testItem);
            assert.equal(calls, 0);
        });
        it('async fail', async function() {
            const testItem = <Item>{};
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
                publish: function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                }
            });
            pc.addClient(<PublisherClient><unknown>{
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 2", {value: 2});
                }
            });
            pc.addClient(<PublisherClient><unknown>{
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 3", {value: 3});
                }
            });
            let resultEx: any = null;
            await assert.rejects(async () => {
                await pc.publish("chan", testItem);
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.equal(resultEx.message, "error 2");
            assert.equal(resultEx.context.value, 2);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            let pc = new Publisher();
            pc.addClient(<PublisherClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            pc.addClient(<PublisherClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await pc.publish('chan', 'item' as unknown as IItem);
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
    describe('#publishHttpResponse', function () {
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
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
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            pc.addClient(<PublisherClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await pc.publishHttpResponse('chan', 'message');
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
    describe('#publishHttpStream', function () {
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
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
            const pc = new Publisher();
            pc.addClient(<PublisherClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            pc.addClient(<PublisherClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await pc.publishHttpStream('chan', 'message');
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
});
