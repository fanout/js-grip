// noinspection DuplicatedCode

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';

import {
    Item,
    IItem,
    Auth,
    PublisherClient,
    Publisher,
    HttpResponseFormat,
    HttpStreamFormat,
    PublishException,
    ValidateGripSigResult,
} from '../../../src/index.js';

import { PRIVATE_KEY_1, PUBLIC_KEY_1 } from "../sampleKeys.js";

const textEncoder = new TextEncoder();

describe('Publisher', function () {
    describe('#constructor', function () {
        it('allows for creation of empty Publisher object', function () {
            const publisher = new Publisher();
            assert.equal(publisher.clients.length, 0);
        });
        it('allows for creation of Publisher object based on single input', function () {
            const publisher = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            assert.equal(publisher.clients.length, 1);
        });
        it('allows for creation of Publisher object based on multiple inputs', async function () {
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
            assert.equal(publisher.clients.length, 2);

            assert.ok(publisher.clients[0] instanceof PublisherClient);
            assert.equal(publisher.clients[0].publishUri, 'https://www.example.com/uri2/publish/');
            const auth0 = publisher.clients[0].getAuth()
            assert.ok(auth0 instanceof Auth.Jwt);
            assert.equal(auth0.getClaim()['iss'], 'iss2');
            assert.deepStrictEqual(auth0.getKey(), textEncoder.encode('key==2'));
            assert.equal(publisher.clients[0].getVerifyIss(), 'v_iss2');
            assert.deepStrictEqual(publisher.clients[0].getVerifyKey(), textEncoder.encode('v_key==2'));

            assert.ok(publisher.clients[1] instanceof PublisherClient);
            assert.equal(publisher.clients[1].publishUri, 'https://www.example.com/uri3/publish/');
            const auth1 = publisher.clients[1].getAuth()
            assert.ok(auth1 instanceof Auth.Jwt);
            assert.equal(auth1.getClaim()['iss'], 'iss3');
            assert.deepStrictEqual(auth1.getKey(), textEncoder.encode('key==3'));
            assert.equal(publisher.clients[1].getVerifyIss(), undefined);
            assert.deepStrictEqual(publisher.clients[1].getVerifyKey(), textEncoder.encode('key==3'));
        });
    });
    describe('#applyConfig', function () {
        it('allows for appending additional configs', async function () {
            const publisher = new Publisher();
            publisher.applyConfig({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });

            assert.equal(publisher.clients.length, 1);

            assert.ok(publisher.clients[0] instanceof PublisherClient);
            assert.equal(publisher.clients[0].publishUri, 'https://www.example.com/uri/publish/');
            let auth0 = publisher.clients[0].getAuth()
            assert.ok(auth0 instanceof Auth.Jwt);
            assert.equal(auth0.getClaim()['iss'], 'iss');
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
            assert.equal(publisher.clients.length, 3);

            assert.ok(publisher.clients[0] instanceof PublisherClient);
            assert.equal(publisher.clients[0].publishUri, 'https://www.example.com/uri/publish/');
            auth0 = publisher.clients[0].getAuth()
            assert.ok(auth0 instanceof Auth.Jwt);
            assert.equal(auth0.getClaim()['iss'], 'iss');
            assert.deepStrictEqual(auth0.getKey(), textEncoder.encode('key=='));
            assert.equal(publisher.clients[0].getVerifyIss(), undefined);
            assert.deepStrictEqual(publisher.clients[0].getVerifyKey(), textEncoder.encode('key=='));

            assert.ok(publisher.clients[1] instanceof PublisherClient);
            assert.equal(publisher.clients[1].publishUri, 'https://www.example.com/uri2/publish/');
            const auth1 = publisher.clients[1].getAuth()
            assert.ok(auth1 instanceof Auth.Jwt);
            assert.equal(auth1.getClaim()['iss'], 'iss2');
            assert.deepStrictEqual(auth1.getKey(), textEncoder.encode('key==2'));
            assert.equal(publisher.clients[1].getVerifyIss(), 'v_iss2');
            assert.deepStrictEqual(publisher.clients[1].getVerifyKey(), textEncoder.encode('v_key==2'));

            assert.ok(publisher.clients[2] instanceof PublisherClient);
            assert.equal(publisher.clients[2].publishUri, 'https://www.example.com/uri3/publish/');
            const auth2 = publisher.clients[2].getAuth()
            assert.ok(auth2 instanceof Auth.Jwt);
            assert.equal(auth2.getClaim()['iss'], 'iss3');
            assert.deepStrictEqual(auth2.getKey(), textEncoder.encode('key==3'));
            assert.equal(publisher.clients[2].getVerifyIss(), undefined);
            assert.deepStrictEqual(publisher.clients[2].getVerifyKey(), textEncoder.encode('key==3'));
        });
    });
    describe('#addClients', function () {
        it('allows adding of a client', function () {
            const publisher = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            assert.equal(publisher.clients.length, 1);
            publisher.addClient(new PublisherClient({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            }));
            assert.equal(publisher.clients.length, 2);
        });
    });
    describe('#publish', function () {
        it('test case', async function () {
            let wasPublishCalled = false;
            const testItem = {} as Item;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    wasPublishCalled = true;
                }
            });
            await publisher.publish("chan", testItem);
            assert.ok(wasPublishCalled);
        });
        it('async', async function() {
            const testItem = {} as Item;
            let calls = 2;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            publisher.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            });
            await publisher.publish("chan", testItem);
            assert.equal(calls, 0);
        });
        it('async fail', async function() {
            const testItem = {} as Item;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                }
            });
            publisher.addClient({
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 2", {value: 2});
                }
            });
            publisher.addClient({
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 3", {value: 3});
                }
            });
            let resultEx: any = null;
            await assert.rejects(async () => {
                await publisher.publish("chan", testItem);
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
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await publisher.publish('chan', 'item' as unknown as IItem);
            assert.strictEqual(publishCalled, 2);
        });
    });
    describe('#publishHttpResponse', function () {
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat('1', '2', '3',
                            '4'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            });
            await publisher.publishHttpResponse('chan', new HttpResponseFormat(
                '1', '2', '3', '4'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await publisher.publishHttpResponse('chan', 'message');
            assert.strictEqual(publishCalled, 2);
        });
    });
    describe('#publishHttpStream', function () {
        it('makes sure that publish is called on the client.', async function () {
            let wasPublishCalled = false;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat('1'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            });
            await publisher.publishHttpStream('chan', new HttpStreamFormat(
                '1'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            const publisher = new Publisher();
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            publisher.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            });
            await publisher.publishHttpStream('chan', 'message');
            assert.strictEqual(publishCalled, 2);
        });
    });
    describe('#validateGripSig', () => {
        describe("When publisher has zero clients", () => {
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

        describe("When publisher has multiple clients, and at least one doesn't require a verify key", () => {
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

        describe("When publisher has multiple clients, and all of them require a verify key", () => {
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
                        verify_key: PUBLIC_KEY_1,
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
                    const privateKey1 = await jose.importPKCS8(PRIVATE_KEY_1, 'RS256');
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
