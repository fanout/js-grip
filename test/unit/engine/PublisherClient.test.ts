import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    Auth,
    Item,
    Format,
    PublisherClient,
    PublishException,
    encodeBytesToBase64String,
    PUBLIC_KEY_FASTLY_FANOUT_JWK,
    JwkKey,
} from '../../../src/index.js';

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

const textEncoder = new TextEncoder();

describe('PublisherClient', () => {
    describe('#constructor', () => {
        it('constructs with just a control URI', async () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            });
            assert.strictEqual(pcc.publishUri, 'https://www.example.com/publish/');
            assert.strictEqual(pcc.getAuth(), undefined);
            assert.strictEqual(pcc.getVerifyIss(), undefined);
            assert.strictEqual(pcc.getVerifyKey(), undefined);
        });
        it('constructs with user and pass to use Basic auth', () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                user: 'user',
                pass: 'pass',
            });
            const auth = pcc.getAuth();
            assert.ok(auth instanceof Auth.Basic);
            assert.strictEqual(auth.getUser(), 'user');
            assert.strictEqual(auth.getPass(), 'pass');
        });
        it('constructs with iss and key to use JWT auth', async () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                control_iss: 'foo',
                key: textEncoder.encode('key'),
            });
            const auth = pcc.getAuth();
            assert.ok(auth instanceof Auth.Jwt);
            assert.deepStrictEqual(auth.getClaim(), {iss: 'foo'});
            assert.deepStrictEqual(auth.getKey(), textEncoder.encode('key'));
        });
        it('constructs with token to use Bearer auth', () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                key: 'token',
            });
            const auth = pcc.getAuth();
            assert.ok(auth instanceof Auth.Bearer);
            assert.strictEqual(auth.getToken(), 'token');
        });
        it('constructs with verify_iss and verify_key', async () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                verify_iss: 'iss',
                verify_key: PUBLIC_KEY_FASTLY_FANOUT_JWK,
            });
            assert.strictEqual(pcc.getVerifyIss(), 'iss');
            const verifyKey = pcc.getVerifyKey();
            assert.ok(verifyKey instanceof JwkKey);
        });
    });
    describe('#getVerifyIss', () => {
        it('has no value if not set', () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            });
            assert.strictEqual(pcc.getVerifyIss(), undefined);
        });
        it('has the value if set', () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                verify_iss: 'iss',
                verify_key: 'key',
            });
            assert.strictEqual(pcc.getVerifyIss(), 'iss');
        });
    });
    describe('#getVerifyKey', () => {
        it('has no value if not set and no auth', async () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            });
            assert.strictEqual(pcc.getVerifyKey(), undefined);
        });
        it('has the value if JWT auth key is set', async () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                control_iss: 'foo',
                key: 'key',
            });
            assert.deepStrictEqual(pcc.getVerifyKey(), textEncoder.encode('key'));
        });
        it('has the value if verify_key is set', async () => {
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                control_iss: 'foo',
                key: 'key2',
                verify_iss: 'iss',
                verify_key: 'key1',
            });
            // the verifyKey should win when both are provided
            assert.deepStrictEqual(pcc.getVerifyKey(), textEncoder.encode('key1'));
        });
    });
    describe('#publish', () => {
        it('sets content-type header', async () => {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            }, {
                async fetch(url, init) {
                    const headers = new Headers(init?.headers);
                    assert.strictEqual(headers.get('Content-Type'), 'application/json');
                    wasWorkerCalled = true;
                    return new Response();
                }
            });
            await pcc.publish('channel', itm);
            assert.ok(wasWorkerCalled);
        });
        it('sets content-length header', async () => {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            }, {
                async fetch(url, init) {
                    const body = init?.body;
                    const text = await new Response(body).text();

                    const headers = new Headers(init?.headers);
                    assert.strictEqual(headers.get('Content-Length'), String(textEncoder.encode(text).length));
                    wasWorkerCalled = true;
                    return new Response();
                }
            });
            await pcc.publish('channel', itm);
            assert.ok(wasWorkerCalled);
        });
        it('auth', async () => {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
                user: 'user',
                pass: 'pass',
            }, {
                async fetch(url, init) {
                    const headers = new Headers(init?.headers);
                    assert.strictEqual(headers.get('Authorization'), `Basic ${encodeBytesToBase64String(textEncoder.encode('user:pass'))}`);

                    const body = init?.body;
                    const json = await new Response(body).json();
                    assert.deepStrictEqual(json.items, [exportedItem]);
                    wasWorkerCalled = true;
                    return new Response();
                }
            });
            await pcc.publish('channel', itm);
            assert.ok(wasWorkerCalled);
        });
        it('no auth', async () => {
            let wasWorkerCalled = false;
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            }, {
                async fetch(url, init) {
                    const headers = new Headers(init?.headers);
                    assert.ok(headers.get('Authorization') == null);

                    const body = init?.body;
                    const json = await new Response(body).json();
                    assert.deepStrictEqual(json.items, [exportedItem]);
                    wasWorkerCalled = true;
                    return new Response();
                }
            });
            await pcc.publish('channel', itm);
            assert.ok(wasWorkerCalled);
        });
        it('fail', async () => {
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com'
            }, {
                fetch(url, init) {
                    throw new Error('fail');
                }
            });
            await assert.rejects(async () => {
                await pcc.publish('channel', itm);
            }, ex => {
                assert.ok(ex instanceof PublishException);
                assert.strictEqual(ex.message, 'fail');
                return true;
            });
        });
        it('test', async () => {
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            }, {
                async fetch(url, init) {
                    return new Response(
                        'result',
                        {
                          status: 200
                        },
                    );
                }
            });
            await assert.doesNotReject(async () => {
                await pcc.publish('channel', itm);
            });
        });
        it('failure', async () => {
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            }, {
                async fetch(url, init) {
                    return new Response(
                        'result',
                        {
                            status: 300
                        },
                    );
                }
            });
            await assert.rejects(async () => {
                await pcc.publish('channel', itm);
            }, ex => {
                assert.ok(ex instanceof PublishException);
                assert.strictEqual(ex.message, '\"result\"');
                assert.strictEqual(ex.context.statusCode, 300);
                return true;
            });
        });
        it('request close', async () => {
            const itm = new Item(new TestFormat('bodyval'));
            const exportedItem = itm.export();
            exportedItem['channel'] = 'channel';
            const pcc = new PublisherClient({
                control_uri: 'https://www.example.com/',
            }, {
                async fetch(url, init) {
                    const res = new Response(
                        'result',
                        {
                            status: 300
                        },
                    );
                    // Consume body to simulate connection closed
                    await res.text();
                    return res;
                }
            });
            await assert.rejects(async () => {
                await pcc.publish('channel', itm);
            }, ex => {
                assert.ok(ex instanceof PublishException);
                assert.strictEqual(ex.message, 'Connection closed unexpectedly');
                assert.strictEqual(ex.context.statusCode, 300);
                return true;
            });
        });
    });
});
