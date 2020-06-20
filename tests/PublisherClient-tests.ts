import assert from "assert";

import Item from '../src/data/Item';
import Format from '../src/data/Format';
import PublisherClient from "../src/engine/PublisherClient";
import PublishException from "../src/data/PublishException";
import Basic from "../src/auth/Basic";
import Jwt from "../src/auth/Jwt";
import IItemExport from "../src/data/IItemExport";

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
            const pcc = new PublisherClient("uri");
            assert.equal(pcc.uri, "uri");
            assert.equal(pcc.auth, null);
            assert.notEqual(pcc.httpKeepAliveAgent, null);
            assert.notEqual(pcc.httpsKeepAliveAgent, null);
        });
    });
    describe('#setAuthBasic', function() {
        it('test case', function() {
            const pcc = new PublisherClient("uri");
            pcc.setAuthBasic("user", "pass");
            assert.equal((<Basic>pcc.auth).user, "user");
            assert.equal((<Basic>pcc.auth).pass, "pass");
        });
    });
    describe('#setAuthJwt', function() {
        it('key and claim', function() {
            const pcc = new PublisherClient("uri");
            const claim = {};
            pcc.setAuthJwt(claim, "key");
            assert.equal((<Jwt>pcc.auth).claim, claim);
            assert.equal((<Jwt>pcc.auth).key, "key");
        });
        it('token', function() {
            const pcc = new PublisherClient("uri");
            pcc.setAuthJwt("token");
            assert.equal((<Jwt>pcc.auth).token, "token");
        });
    });
    describe('#publish', function() {
        it('auth', async function() {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat("bodyval"));
            const exportedItem = itm.export();
            exportedItem["channel"] = "channel";
            const pcc = new PublisherClient("uri");
            pcc._startPubCall = async function(uri, authHeader, items) {
                assert.equal(uri, "uri");
                assert.equal(
                    authHeader,
                    "Basic " + Buffer.from("user:pass").toString("base64")
                );
                assert.equal(JSON.stringify(items), JSON.stringify([exportedItem]));
                wasWorkerCalled = true;
            };
            pcc.setAuthBasic("user", "pass");
            await pcc.publish("channel", itm);
            assert(wasWorkerCalled);
        });
        it('no auth', async function() {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat("bodyval"));
            const exportedItem = itm.export();
            exportedItem["channel"] = "channel";
            const pcc = new PublisherClient("uri");
            pcc._startPubCall = async function(uri, authHeader, items) {
                assert.equal(uri, "uri");
                assert.equal(authHeader, null);
                assert.equal(JSON.stringify(items), JSON.stringify([exportedItem]));
                wasWorkerCalled = true;
            };
            await pcc.publish("channel", itm);
            assert(wasWorkerCalled);
        });
        it('fail', async function() {
            const itm = new Item(new TestFormat("bodyval"));
            const exportedItem = itm.export();
            exportedItem["channel"] = "channel";
            const pcc = new PublisherClient("uri");
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
            assert(resultEx instanceof PublishException);
            assert.strictEqual(resultEx.message, "fail");
        });
    });
    describe('#_startPubCall', function() {
        it('test', async function() {
            const pcc = new PublisherClient("http://uri.com");
            const testItems: IItemExport[] = [];
            let wasPerformHttpRequestCalled = false;
            pcc._performHttpRequest = async function(_transport, uri, reqParams) {
                assert.equal(reqParams.body, JSON.stringify({ items: testItems }));
                assert.equal(reqParams.method, "POST");
                assert.notEqual(reqParams.headers, null);
                assert.equal(reqParams.headers["Content-Type"], "application/json");
                assert.equal(
                    reqParams.headers["Content-Length"],
                    Buffer.byteLength(reqParams.body, "utf8")
                );
                assert.equal(reqParams.headers["Authorization"], "authHeader");
                assert.equal(uri, "http://uri.com/publish/");
                assert.equal(pcc.httpKeepAliveAgent, reqParams.agent);
                wasPerformHttpRequestCalled = true;
            };
            await pcc._startPubCall("http://uri.com", "authHeader", testItems);
            assert(wasPerformHttpRequestCalled);
        });
        it('https', async function() {
            const pcc = new PublisherClient("https://uri.com");
            const testItems: IItemExport[] = [];
            let wasPerformHttpRequestCalled = false;
            pcc._performHttpRequest = async function(_transport, uri, reqParams) {
                assert.equal(reqParams.body, JSON.stringify({ items: testItems }));
                assert.equal(reqParams.method, "POST");
                assert.equal(reqParams.headers["Content-Type"], "application/json");
                assert.equal(
                    reqParams.headers["Content-Length"],
                    Buffer.byteLength(reqParams.body, "utf8")
                );
                assert(!("Authorization" in reqParams.headers));
                assert.equal(uri, "https://uri.com/publish/");
                assert.equal(pcc.httpsKeepAliveAgent, reqParams.agent);
                wasPerformHttpRequestCalled = true;
            };
            await pcc._startPubCall("https://uri.com", null, testItems);
            assert(wasPerformHttpRequestCalled);
        });
        it('bad uri', async function() {
            const pcc = new PublisherClient("https://uri.com");
            const testItems: IItemExport[] = [];
            let resultEx: any = null;
            await assert.rejects(async () => {
                await pcc._startPubCall("file://uri.com", null, testItems);
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert(resultEx instanceof PublishException);
            assert.equal(resultEx.message, "Bad URI");
            assert.equal(resultEx.context.statusCode, -2);
        });
    });
    describe('#_finishHttpRequest', function() {
        const pcc = new PublisherClient("https://uri.com");
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
        const pcc = new PublisherClient("https://uri.com");
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

        beforeEach(function() {
            wasFinishHttpRequestCalled = false;
            wasFinishHttpRequestCalledForClose = false;
        });

        it('fail', async function() {
            const failTransport = async (_ur: any, opts: any) => {
                assert.equal(opts.body, "content");
                throw {message: "message"};
            };

            let resultEx: any = null;
            await assert.rejects(async () => {
                await pcc._performHttpRequest(failTransport, "https://uri.com/publish/", {
                    agent: undefined,
                    headers: {},
                    method: "",
                    body: "content"
                });
            }, ex => {
                resultEx = ex;
                return true;
            });
            assert.ok(resultEx instanceof PublishException);
            assert.equal(resultEx.message, "message");
            assert.equal(resultEx.context.statusCode, -1);
            assert(!wasFinishHttpRequestCalled);
            assert(!wasFinishHttpRequestCalledForClose);
        });
        it('close', async function() {
            const closeTransport = async (_uri: any, opts: any) => {
                assert.equal(opts.body, "content");
                return {
                    status: 200,
                    headers: {},
                    text: async () => {
                        throw "error";
                    },
                };
            };

            await pcc._performHttpRequest(closeTransport, "https://uri.com/publish/", {
                agent: undefined,
                headers: {},
                method: "",
                body: "content"
            });
            assert(!wasFinishHttpRequestCalled);
            assert(wasFinishHttpRequestCalledForClose);
        });
        it('success', async function() {
            const successTransport = async (_uri: any, opts: any) => {
                assert.equal(opts.body, "content");
                return {
                    status: 200,
                    headers: {},
                    text: async () => {
                        return "result";
                    },
                };
            };

            await pcc._performHttpRequest(successTransport, "https://uri.com/publish/", {
                agent: undefined,
                headers: {},
                method: "",
                body: "content"
            });
            assert(wasFinishHttpRequestCalled);
            assert(!wasFinishHttpRequestCalledForClose);
        });
    });
});
