// noinspection DuplicatedCode

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';
import {
    type IItem,
    Item,
    Auth,
    PublisherClient,
    Publisher,
    HttpResponseFormat,
    HttpStreamFormat,
    PublishException,
    ValidateGripSigResult,
} from '../../../src/index.js';
import { SAMPLEKEY_RSA_PRIVATE_PEM, SAMPLEKEY_RSA_PUBLIC_PEM } from '../sampleKeys.js';

const textEncoder = new TextEncoder();

describe('Publisher', () => {
    describe('#constructor', () => {
        it('allows for creation of empty Publisher object', () => {
            const publisher = new Publisher();
            assert.strictEqual(publisher.clients.length, 0);
        });
        it('allows for creation of Publisher object based on single input', () => {
            const publisher = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            assert.strictEqual(publisher.clients.length, 1);
        });
        it('allows for creation of Publisher object based on multiple inputs', async () => {
            const publisher = new Publisher([
                {
                    'control_uri': 'https://www.example.com/uri2',
                    'control_iss': 'iss2',
                    'key': 'key==2',
                    'verify_iss': 'v_iss2',
                    'verify_key': 'v_key==2',
                },
                {
                    'control_uri': 'https://www.example.com/uri3',
                    'control_iss': 'iss3',
                    'key': 'key==3',
                },
            ]);
            assert.strictEqual(publisher.clients.length, 2);

            assert.ok(publisher.clients[0] instanceof PublisherClient);
            assert.strictEqual(publisher.clients[0].publishUri, 'https://www.example.com/uri2/publish/');
            const auth0 = publisher.clients[0].getAuth()
            assert.ok(auth0 instanceof Auth.Jwt);
            assert.strictEqual(auth0.getClaim()['iss'], 'iss2');
            assert.deepStrictEqual(auth0.getKey(), textEncoder.encode('key==2'));
            assert.strictEqual(publisher.clients[0].getVerifyIss(), 'v_iss2');
            assert.deepStrictEqual(publisher.clients[0].getVerifyKey(), textEncoder.encode('v_key==2'));

            assert.ok(publisher.clients[1] instanceof PublisherClient);
            assert.strictEqual(publisher.clients[1].publishUri, 'https://www.example.com/uri3/publish/');
            const auth1 = publisher.clients[1].getAuth()
            assert.ok(auth1 instanceof Auth.Jwt);
            assert.strictEqual(auth1.getClaim()['iss'], 'iss3');
            assert.deepStrictEqual(auth1.getKey(), textEncoder.encode('key==3'));
            assert.strictEqual(publisher.clients[1].getVerifyIss(), undefined);
            assert.deepStrictEqual(publisher.clients[1].getVerifyKey(), textEncoder.encode('key==3'));
        });
    });
    describe('#applyConfig', () => {
        it('allows for appending additional configs', async () => {
            const publisher = new Publisher();
            publisher.applyConfig({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });

            assert.strictEqual(publisher.clients.length, 1);

            assert.ok(publisher.clients[0] instanceof PublisherClient);
            assert.strictEqual(publisher.clients[0].publishUri, 'https://www.example.com/uri/publish/');
            let auth0 = publisher.clients[0].getAuth()
            assert.ok(auth0 instanceof Auth.Jwt);
            assert.strictEqual(auth0.getClaim()['iss'], 'iss');
            assert.deepStrictEqual(auth0.getKey(), textEncoder.encode('key=='));

            publisher.applyConfigs([
                {
                    'control_uri': 'https://www.example.com/uri2',
                    'control_iss': 'iss2',
                    'key': 'key==2',
                    'verify_iss': 'v_iss2',
                    'verify_key': 'v_key==2',
                },
                {
                    'control_uri': 'https://www.example.com/uri3',
                    'control_iss': 'iss3',
                    'key': 'key==3',
                },
            ]);
            assert.strictEqual(publisher.clients.length, 3);

            assert.ok(publisher.clients[0] instanceof PublisherClient);
            assert.strictEqual(publisher.clients[0].publishUri, 'https://www.example.com/uri/publish/');
            auth0 = publisher.clients[0].getAuth()
            assert.ok(auth0 instanceof Auth.Jwt);
            assert.strictEqual(auth0.getClaim()['iss'], 'iss');
            assert.deepStrictEqual(auth0.getKey(), textEncoder.encode('key=='));
            assert.strictEqual(publisher.clients[0].getVerifyIss(), undefined);
            assert.deepStrictEqual(publisher.clients[0].getVerifyKey(), textEncoder.encode('key=='));

            assert.ok(publisher.clients[1] instanceof PublisherClient);
            assert.strictEqual(publisher.clients[1].publishUri, 'https://www.example.com/uri2/publish/');
            const auth1 = publisher.clients[1].getAuth()
            assert.ok(auth1 instanceof Auth.Jwt);
            assert.strictEqual(auth1.getClaim()['iss'], 'iss2');
            assert.deepStrictEqual(auth1.getKey(), textEncoder.encode('key==2'));
            assert.strictEqual(publisher.clients[1].getVerifyIss(), 'v_iss2');
            assert.deepStrictEqual(publisher.clients[1].getVerifyKey(), textEncoder.encode('v_key==2'));

            assert.ok(publisher.clients[2] instanceof PublisherClient);
            assert.strictEqual(publisher.clients[2].publishUri, 'https://www.example.com/uri3/publish/');
            const auth2 = publisher.clients[2].getAuth()
            assert.ok(auth2 instanceof Auth.Jwt);
            assert.strictEqual(auth2.getClaim()['iss'], 'iss3');
            assert.deepStrictEqual(auth2.getKey(), textEncoder.encode('key==3'));
            assert.strictEqual(publisher.clients[2].getVerifyIss(), undefined);
            assert.deepStrictEqual(publisher.clients[2].getVerifyKey(), textEncoder.encode('key==3'));
        });
    });
    describe('#addClients', () => {
        it('allows adding of a client', () => {
            const publisher = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            assert.strictEqual(publisher.clients.length, 1);
            publisher.addClient(new PublisherClient({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            }));
            assert.strictEqual(publisher.clients.length, 2);
        });
    });
    describe('#publish', () => {
        it('calls publish of PublisherClient', async () => {
            let wasPublishCalled = false;
            const testItem = {} as Item;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel, item) {
                    assert.strictEqual(channel, 'chan');
                    assert.strictEqual(item, testItem);
                    wasPublishCalled = true;
                }
            });
            await publisher.publish('chan', testItem);
            assert.ok(wasPublishCalled);
        });
        it('calls publish of all publisher clients', async () => {
            let calls = 2;
            const testItem = {} as Item;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel, item) {
                    assert.strictEqual(channel, 'chan');
                    assert.strictEqual(item, testItem);
                    calls--;
                }
            });
            publisher.addClient({
                async publish(channel, item) {
                    assert.strictEqual(channel, 'chan');
                    assert.strictEqual(item, testItem);
                    calls--;
                }
            });
            await publisher.publish('chan', testItem);
            assert.strictEqual(calls, 0);
        });
        it('rejects when a publish fails', async () => {
            const testItem = {} as Item;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel, item) {
                    assert.strictEqual(channel, 'chan');
                    assert.strictEqual(item, testItem);
                }
            });
            publisher.addClient({
                publish(channel: string, item: IItem) {
                    assert.strictEqual(channel, 'chan');
                    assert.strictEqual(item, testItem);
                    throw new PublishException('error 2', { statusCode: 2 });
                }
            });
            publisher.addClient({
                publish(channel: string, item: IItem) {
                    assert.strictEqual(channel, 'chan');
                    assert.strictEqual(item, testItem);
                    throw new PublishException('error 3', { statusCode: 3 });
                }
            });
            await assert.rejects(async () => {
                await publisher.publish('chan', testItem);
            }, ex => {
                assert.ok(ex instanceof PublishException);
                assert.strictEqual(ex.message, 'error 2');
                assert.strictEqual(ex.context.statusCode, 2);
                return true;
            });
        });
        it('makes sure that publish is called on each client.', async () => {
            let publishCalled = 0;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(item, 'item');
                    assert.strictEqual(channel, 'chan');
                    publishCalled++;
                }
            });
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(item, 'item');
                    assert.strictEqual(channel, 'chan');
                    publishCalled++;
                }
            });
            await publisher.publish('chan', 'item' as unknown as IItem);
            assert.strictEqual(publishCalled, 2);
        });
        it('applies the prefix specified in the constructor', async () => {
            let publishCalled = 0;
            const publisher = new Publisher(undefined, {
                prefix: 'foo',
            });
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(item, 'item');
                    assert.strictEqual(channel, 'foochan');
                    publishCalled++;
                }
            });
            await publisher.publish('chan', 'item' as unknown as IItem);
            assert.strictEqual(publishCalled, 1);
        });
    });
    describe('#publishHttpResponse', () => {
        it('makes sure that publish is called on the client.', async () => {
            let wasPublishCalled = false;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat('1', '2', {'_': '3'},
                            '4'))));
                    assert.strictEqual(channel, 'chan');
                    wasPublishCalled = true;
                }
            });
            await publisher.publishHttpResponse('chan', new HttpResponseFormat(
                '1', '2', {'_': '3'}, '4'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async () => {
            let publishCalled = 0;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.strictEqual(channel, 'chan');
                    publishCalled++;
                }
            });
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.strictEqual(channel, 'chan');
                    publishCalled++;
                }
            });
            await publisher.publishHttpResponse('chan', 'message');
            assert.strictEqual(publishCalled, 2);
        });
    });
    describe('#publishHttpStream', () => {
        it('makes sure that publish is called on the client.', async () => {
            let wasPublishCalled = false;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat('1'))));
                    assert.strictEqual(channel, 'chan');
                    wasPublishCalled = true;
                }
            });
            await publisher.publishHttpStream('chan', new HttpStreamFormat(
                '1'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async () => {
            let publishCalled = 0;
            const publisher = new Publisher();
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.strictEqual(channel, 'chan');
                    publishCalled++;
                }
            });
            publisher.addClient({
                async publish(channel: string, item: IItem) {
                    assert.strictEqual(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.strictEqual(channel, 'chan');
                    publishCalled++;
                }
            });
            await publisher.publishHttpStream('chan', 'message');
            assert.strictEqual(publishCalled, 2);
        });
    });
    describe('#validateGripSig', () => {
        describe('When publisher has zero clients', () => {
            let publisher: Publisher;
            beforeEach(async () => {
                publisher = new Publisher();
            });

            describe('When no grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await publisher.validateGripSig(null);
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, false);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, false);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });

            describe('When grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await publisher.validateGripSig('value');
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, false);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, false);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });
        });

        describe('When publisher has multiple clients, and at least one doesn\'t require a verify key', () => {
            let publisher: Publisher;
            beforeEach(async () => {
                publisher = new Publisher([
                    {
                        control_uri: 'https://www.example1.com',
                        control_iss: 'foo',
                        key: 'key==',
                    },
                    {
                        control_uri: 'https://www.example2.com',
                    },
                ]);
            });

            describe('When no grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await publisher.validateGripSig(null);
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, false);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, false);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });

            describe('When invalid grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await publisher.validateGripSig('value');
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, true);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, false);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });

            describe('When valid grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    const signJwt = new jose.SignJWT({
                        'claim': 'hello',
                        'iss': 'bar',
                    })
                      .setProtectedHeader({ alg: 'HS256' })
                      .setExpirationTime('1h');
                    const token = await signJwt.sign(textEncoder.encode('key=='));

                    proxyStatus = await publisher.validateGripSig(token);
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, true);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, false);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });
        });

        describe('When publisher has multiple clients, and all of them require a verify key', () => {
            let publisher: Publisher;
            beforeEach(async () => {
                publisher = new Publisher([
                    {
                        control_uri: 'https://www.example1.com',
                        control_iss: 'foo',
                        key: 'key==',
                    },
                    {
                        control_uri: 'https://www.example2.com',
                        verify_iss: 'bar',
                        verify_key: SAMPLEKEY_RSA_PUBLIC_PEM,
                    },
                ]);
            });

            describe('When no grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await publisher.validateGripSig(null);
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, false);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, false);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });

            describe('When invalid grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await publisher.validateGripSig('value');
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, false);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, true);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, false);
                });
            });

            describe('When grip-sig valid against one client is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    const signJwt = new jose.SignJWT({
                        'claim': 'hello',
                        'iss': 'bar',
                    })
                      .setProtectedHeader({ alg: 'HS256' })
                      .setExpirationTime('1h');
                    const token = await signJwt.sign(textEncoder.encode('key=='));

                    proxyStatus = await publisher.validateGripSig(token);
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, true);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, true);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, true);
                });
            });

            describe('When grip-sig valid against another client is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    const signJwt = new jose.SignJWT({
                        'claim': 'hello',
                        'iss': 'bar',
                    })
                      .setProtectedHeader({ alg: 'RS256' })
                      .setExpirationTime('1h');
                    const privateKey1 = await jose.importPKCS8(SAMPLEKEY_RSA_PRIVATE_PEM, 'RS256');
                    const token = await signJwt.sign(privateKey1);

                    proxyStatus = await publisher.validateGripSig(token);
                });
                it('returns false for isProxied', () => {
                    assert.strictEqual(proxyStatus.isProxied, true);
                });
                it('returns false for needsSigned', () => {
                    assert.strictEqual(proxyStatus.needsSigned, true);
                });
                it('returns false for isSigned', () => {
                    assert.strictEqual(proxyStatus.isSigned, true);
                });
            });
        });
    });
});
