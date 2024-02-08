import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';

import { Auth, Item, Format, PublisherClient, PublishException, IItemExport, IPublisherTransport } from '../../../src/index.js';

class TestFormat extends Format {
    content: string;
    constructor(content: string) {
        super();
        this.content = content;
    }
    name() {
        return 'testformat';
    }
    export() {
        return { content: this.content };
    }
}

describe('PublisherClient', function() {
    describe('#constructor', function() {
        it('test case', function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            assert.equal(pcc.transport, publisherTransport);
        });
    });
    describe('#setAuthBasic', function() {
        it('test case', function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc.setAuthBasic("user", "pass");
            assert.equal((pcc.auth as Auth.Basic).user, "user");
            assert.equal((pcc.auth as Auth.Basic).pass, "pass");
        });
    });
    describe('#setAuthJwt', function() {
        it('key and claim', function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            const claim = {};
            pcc.setAuthJwt(claim, "key");
            assert.equal((pcc.auth as Auth.Jwt).claim, claim);
            assert.equal((pcc.auth as Auth.Jwt).key, "key");
        });
        it('token', function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc.setAuthBearer("token");
            assert.equal((pcc.auth as Auth.Bearer).token, "token");
        });
    });
    describe('#setVerifyComponents', function() {
        it("not calling it doesn't set a value", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            assert.equal(pcc.verifyComponents, undefined);
        });
        it("calling it with sets the value", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc.setVerifyComponents({ verifyIss: 'iss', verifyKey: 'key' });
            assert.equal(pcc.verifyComponents?.verifyIss, 'iss');
            assert.equal(pcc.verifyComponents?.verifyKey, 'key');
        });
    });
    describe('#getVerifyIss', function() {
        it("has no value if #setVerifyComponents is not called", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            assert.equal(pcc.getVerifyIss(), undefined);
        });
        it("has the value if #setVerifyComponents is called", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc.setVerifyComponents({ verifyIss: 'iss', verifyKey: 'key' });
            assert.equal(pcc.getVerifyIss(), 'iss');
        });
    });
    describe('#getVerifyKey', function() {
        it("has no value if #setVerifyComponents is not called and auth isn't set", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            assert.equal(pcc.getVerifyKey(), undefined);
        });
        it("has the value if #setAuthJwt is called", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc.setAuthJwt({}, 'key');
            assert.equal(pcc.getVerifyKey(), 'key');
        });
        it("has the value if #setVerifyComponents is called", function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc.setVerifyComponents({ verifyIss: 'iss', verifyKey: 'key1' });
            pcc.setAuthJwt({}, 'key2');
            // the verifyKey should win when both are provided
            assert.equal(pcc.getVerifyKey(), 'key1');
        });
    });
    describe('#publish', function() {
        it('auth', async function() {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat("bodyval"));
            const exportedItem = itm.export();
            exportedItem["channel"] = "channel";
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc._startPubCall = async function(authHeader, items) {
                assert.equal(
                    authHeader,
                    "Basic " + Buffer.from("user:pass").toString("base64")
                );
                assert.equal(JSON.stringify(items), JSON.stringify([exportedItem]));
                wasWorkerCalled = true;
            };
            pcc.setAuthBasic("user", "pass");
            await pcc.publish("channel", itm);
            assert.ok(wasWorkerCalled);
        });
        it('no auth', async function() {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat("bodyval"));
            const exportedItem = itm.export();
            exportedItem["channel"] = "channel";
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc._startPubCall = async function(authHeader, items) {
                assert.equal(authHeader, null);
                assert.equal(JSON.stringify(items), JSON.stringify([exportedItem]));
                wasWorkerCalled = true;
            };
            await pcc.publish("channel", itm);
            assert.ok(wasWorkerCalled);
        });
        it('fail', async function() {
            const itm = new Item(new TestFormat("bodyval"));
            const exportedItem = itm.export();
            exportedItem["channel"] = "channel";
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc._startPubCall = async function() {
                throw new PublishException('fail', null);
            };
            let resultEx: any = null;
            await assert.rejects(async () => {
                await pcc.publish("channel", itm);
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.strictEqual(resultEx.message, "fail");
        });
    });
    describe('#_startPubCall', function() {
        it('test', async function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, _content): Promise<any> {
                    return Promise.resolve(undefined);
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            const testItems: IItemExport[] = [];
            let wasPerformHttpRequestCalled = false;
            pcc._performHttpRequest = async function(headers, content) {
                assert.equal(content, JSON.stringify({ items: testItems }));
                assert.notEqual(headers, null);
                assert.equal(headers["Content-Type"], "application/json");
                assert.equal(
                    headers["Content-Length"],
                    Buffer.byteLength(content, "utf8")
                );
                assert.equal(headers["Authorization"], "authHeader");
                wasPerformHttpRequestCalled = true;
            };
            await pcc._startPubCall("authHeader", testItems);
            assert.ok(wasPerformHttpRequestCalled);
        });
    });
    describe('#_finishHttpRequest', function() {
        const publisherTransport: IPublisherTransport = {
            publish(_headers, _content): Promise<any> {
                return Promise.resolve(undefined);
            }
        };
        const pcc = new PublisherClient(publisherTransport);
        it('test', async function() {
            assert.doesNotThrow(() => {
                pcc._finishHttpRequest(
                    "end",
                    ["result"],
                    { statusCode: 200 }
                );
            });
        });
        it('failure', async function() {
            let resultEx: any = null;
            assert.throws(() => {
                pcc._finishHttpRequest( "end", "result", { statusCode: 300 } );
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.equal(resultEx.message, '\"result\"');
            assert.equal(resultEx.context.statusCode, 300);
        });
        it('request close', function() {
            let resultEx: any = null;
            assert.throws(() => {
                pcc._finishHttpRequest( "close", "result", { statusCode: 300 } );
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.equal(resultEx.message, 'Connection closed unexpectedly');
            assert.equal(resultEx.context.statusCode, 300);
        });
    });
    describe('#_performHttpRequest', function() {
        let wasFinishHttpRequestCalled: boolean;
        let wasFinishHttpRequestCalledForClose: boolean;
        beforeEach(function() {
            wasFinishHttpRequestCalled = false;
            wasFinishHttpRequestCalledForClose = false;
        });

        it('fail', async function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, content): Promise<any> {
                    assert.equal(content, "content");
                    return Promise.reject("message");
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc._finishHttpRequest = (mode, httpData) => {
                wasFinishHttpRequestCalled = false;
                wasFinishHttpRequestCalledForClose = false;
                if (mode === "end") {
                    wasFinishHttpRequestCalled = true;
                    assert.equal(httpData, "result");
                }
                if (mode === "close") {
                    wasFinishHttpRequestCalledForClose = true;
                }
            };

            let resultEx: any = null;
            await assert.rejects(async () => {
                await pcc._performHttpRequest({}, "content");
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.equal(resultEx.message, "message");
            assert.equal(resultEx.context.statusCode, -1);
            assert.ok(!wasFinishHttpRequestCalled);
            assert.ok(!wasFinishHttpRequestCalledForClose);
        });
        it('close', async function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, content): Promise<any> {
                    assert.equal(content, "content");
                    return Promise.resolve({
                        status: 200,
                        headers: {},
                        text: async () => {
                            throw "error";
                        },
                    });
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc._finishHttpRequest = (mode, httpData) => {
                wasFinishHttpRequestCalled = false;
                wasFinishHttpRequestCalledForClose = false;
                if (mode === "end") {
                    wasFinishHttpRequestCalled = true;
                    assert.equal(httpData, "result");
                }
                if (mode === "close") {
                    wasFinishHttpRequestCalledForClose = true;
                }
            };

            await pcc._performHttpRequest({}, 'content');
            assert.ok(!wasFinishHttpRequestCalled);
            assert.ok(wasFinishHttpRequestCalledForClose);
        });
        it('success', async function() {
            const publisherTransport: IPublisherTransport = {
                publish(_headers, content): Promise<any> {
                    assert.equal(content, "content");
                    return Promise.resolve({
                        status: 200,
                        headers: {},
                        text: async () => {
                            return "result";
                        },
                    });
                }
            };
            const pcc = new PublisherClient(publisherTransport);
            pcc._finishHttpRequest = (mode, httpData) => {
                wasFinishHttpRequestCalled = false;
                wasFinishHttpRequestCalledForClose = false;
                if (mode === "end") {
                    wasFinishHttpRequestCalled = true;
                    assert.equal(httpData, "result");
                }
                if (mode === "close") {
                    wasFinishHttpRequestCalledForClose = true;
                }
            };

            await pcc._performHttpRequest({}, 'content');
            assert.ok(wasFinishHttpRequestCalled);
            assert.ok(!wasFinishHttpRequestCalledForClose);
        });
    });
});
