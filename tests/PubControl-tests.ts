import assert from "assert";

import PubControl from "../src/engine/PubControl";
import PubControlClient from "../src/engine/PubControlClient";
import PublishException from "../src/data/PublishException";
import Item from "../src/data/Item";
import IItem from "../src/data/IItem";

describe('PubControl', function () {
    describe('#constructor', function () {
        it('test case', function () {
            const pc = new PubControl();
            assert.equal(pc.clients.length, 0);
        });
        it('test case', function () {
            const pc = new PubControl({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
        });
    });
    describe('#removeAllClients', function () {
        it('test case', function () {
            const pc = new PubControl({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
            pc.removeAllClients();
            assert.equal(pc.clients.length, 0);
        });
    });
    describe('#addClient', function () {
        it('test case', function () {
            const pc = new PubControl({ uri: "uri", iss: "iss", key: "key==" });
            assert.equal(pc.clients.length, 1);
            pc.addClient(new PubControlClient("uri"));
            assert.equal(pc.clients.length, 2);
        });
    });
    describe('#applyConfig', function () {
        it('test case', function () {
            const pubControl = new PubControl();
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
    describe('#publish', function () {
        it('test case', async function () {
            let wasPublishCalled = false;
            const testItem = <Item>{};
            const pc = new PubControl();
            pc.addClient(<PubControlClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    wasPublishCalled = true;
                }
            });
            await pc.publish("chan", testItem);
            assert(wasPublishCalled);
        });
        it('callback', function(done) {
            let callbackResult: any = null;
            const testItem = <Item>{};
            let calls = 2;
            const pc = new PubControl();
            pc.addClient(<PubControlClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            pc.addClient(<PubControlClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            pc.publish("chan", testItem, (flag, message, context) => {
                callbackResult = { flag, message, context };
                done();
            });
            after(function() {
                assert.equal(calls, 0);
                assert.ok(callbackResult.flag);
                assert.equal(callbackResult.message, null);
                assert.equal(callbackResult.context, null);
            });
        });
        it('callback fail', function(done) {
            let results: any = null;
            const testItem = <Item>{};
            const pc = new PubControl();
            pc.addClient(<PubControlClient>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                }
            });
            pc.addClient(<PubControlClient><unknown>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 2", {value: 2});
                }
            });
            pc.addClient(<PubControlClient><unknown>{
                publish: async function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 3", {value: 3});
                }
            });
            pc.publish("chan", testItem, (flag, message, context) => {
                results = { flag, message, context };
                done();
            });
            after(function() {
                assert.notEqual(results, null);
                assert.equal(results.flag, false);
                assert.equal(results.message, "error 2");
                assert.equal(results.context.value, 2)
            });
        });
        it('async', async function() {
            const testItem = <Item>{};
            let calls = 2;
            const pc = new PubControl();
            pc.addClient(<PubControlClient>{
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            pc.addClient(<PubControlClient>{
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
            const pc = new PubControl();
            pc.addClient(<PubControlClient>{
                publish: function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                }
            });
            pc.addClient(<PubControlClient><unknown>{
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 2", {value: 2});
                }
            });
            pc.addClient(<PubControlClient><unknown>{
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
    });
});
