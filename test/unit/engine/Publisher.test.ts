// noinspection DuplicatedCode

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';

import * as jose from 'jose';

import {
    Item,
    IItem,
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
            const pubControl = new Publisher();
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 0);
        });
        it('allows for creation of Publisher object based on single input', function () {
            const pubControl = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
        });
        it('allows for creation of Publisher object based on multiple inputs', async function () {
            const pubControl = new Publisher([
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
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 2);
            assert.equal(pc.clients[0].publishUri, 'https://www.example.com/uri2/publish/');
            assert.equal(pc.clients[0].getAuth()?.getClaim()['iss'], 'iss2');
            assert.deepStrictEqual(await pc.clients[0].getAuth()?.getKey(), textEncoder.encode('key==2'));
            assert.equal(pc.clients[0].getVerifyIss(), 'v_iss2');
            assert.deepStrictEqual(await pc.clients[0].getVerifyKey(), textEncoder.encode('v_key==2'));
            assert.equal(pc.clients[1].publishUri, 'https://www.example.com/uri3/publish/');
            assert.equal(pc.clients[1].getAuth()?.getClaim()['iss'], 'iss3');
            assert.deepStrictEqual(await pc.clients[1].getAuth()?.getKey(), textEncoder.encode('key==3'));
            assert.equal(pc.clients[1].getVerifyIss(), undefined);
            assert.deepStrictEqual(await pc.clients[1].getVerifyKey(), textEncoder.encode('key==3'));
        });
    });
    describe('#applyConfig', function () {
        it('allows for appending additional configs', async function () {
            let pubControl = new Publisher();
            pubControl.applyConfig({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            assert.equal(pc.clients[0].publishUri, 'https://www.example.com/uri/publish/');
            assert.equal(pc.clients[0].getAuth()?.getClaim()['iss'], 'iss');
            assert.deepStrictEqual(await pc.clients[0].getAuth()?.getKey(), textEncoder.encode('key=='));
            pubControl.applyConfigs([
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
            assert.equal(pc.clients.length, 3);
            assert.equal(pc.clients[0].publishUri, 'https://www.example.com/uri/publish/');
            assert.equal(pc.clients[0].getAuth()?.getClaim()['iss'], 'iss');
            assert.deepStrictEqual(await pc.clients[0].getAuth()?.getKey(), textEncoder.encode('key=='));
            assert.equal(pc.clients[0].getVerifyIss(), undefined);
            assert.deepStrictEqual(await pc.clients[0].getVerifyKey(), textEncoder.encode('key=='));
            assert.equal(pc.clients[1].publishUri, 'https://www.example.com/uri2/publish/');
            assert.equal(pc.clients[1].getAuth()?.getClaim()['iss'], 'iss2');
            assert.deepStrictEqual(await pc.clients[1].getAuth()?.getKey(), textEncoder.encode('key==2'));
            assert.equal(pc.clients[1].getVerifyIss(), 'v_iss2');
            assert.deepStrictEqual(await pc.clients[1].getVerifyKey(), textEncoder.encode('v_key==2'));
            assert.equal(pc.clients[2].publishUri, 'https://www.example.com/uri3/publish/');
            assert.equal(pc.clients[2].getAuth()?.getClaim()['iss'], 'iss3');
            assert.deepStrictEqual(await pc.clients[2].getAuth()?.getKey(), textEncoder.encode('key==3'));
            assert.equal(pc.clients[2].getVerifyIss(), undefined);
            assert.deepStrictEqual(await pc.clients[2].getVerifyKey(), textEncoder.encode('key==3'));
        });
    });
    describe('#addClients', function () {
        it('allows adding of a client', function () {
            let pubControl = new Publisher({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            });
            const pc = pubControl as any;
            assert.equal(pc.clients.length, 1);
            pubControl.addClient(new PublisherClient({
                'control_uri': 'https://www.example.com/uri',
                'control_iss': 'iss',
                'key': 'key==',
            }));
            assert.equal(pc.clients.length, 2);
        });
    });
    describe('#publish', function () {
        it('test case', async function () {
            let wasPublishCalled = false;
            const testItem = {} as Item;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    wasPublishCalled = true;
                }
            } as PublisherClient);
            await pc.publish("chan", testItem);
            assert.ok(wasPublishCalled);
        });
        it('async', async function() {
            const testItem = {} as Item;
            let calls = 2;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    calls--;
                }
            } as PublisherClient);
            await pc.publish("chan", testItem);
            assert.equal(calls, 0);
        });
        it('async fail', async function() {
            const testItem = {} as Item;
            const pc = new Publisher();
            pc.addClient({
                publish: function (channel, item) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                }
            } as PublisherClient);
            pc.addClient({
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 2", {value: 2});
                }
            } as unknown as PublisherClient);
            pc.addClient({
                publish: function (channel: string, item: IItem) {
                    assert.equal(channel, "chan");
                    assert.equal(item, testItem);
                    throw new PublishException("error 3", {value: 3});
                }
            } as unknown as PublisherClient);
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
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(item, 'item');
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
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
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat('1', '2', '3',
                            '4'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            } as PublisherClient);
            await pc.publishHttpResponse('chan', new HttpResponseFormat(
                '1', '2', '3', '4'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpResponseFormat(
                            {body: 'message'}))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
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
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat('1'))));
                    assert.equal(channel, 'chan');
                    wasPublishCalled = true;
                }
            } as PublisherClient);
            await pc.publishHttpStream('chan', new HttpStreamFormat(
                '1'));
            assert.ok(wasPublishCalled);
        });
        it('makes sure that publish is called on each client.', async function () {
            let publishCalled = 0;
            const pc = new Publisher();
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            pc.addClient({
                publish: async function (channel: string, item: IItem) {
                    assert.equal(JSON.stringify(item), JSON.stringify(new Item(
                        new HttpStreamFormat(
                            'message'))));
                    assert.equal(channel, 'chan');
                    publishCalled++;
                }
            } as PublisherClient);
            await pc.publishHttpStream('chan', 'message');
            process.on('beforeExit', () => {
                assert.strictEqual(publishCalled, 2);
            });
        });
    });
    describe('#validateGripSig', () => {
        describe("When publisher has zero clients", () => {
            let p: Publisher;
            beforeEach(async () => {
                p = new Publisher();
            });

            describe('When no grip-sig is provided', () => {
                let proxyStatus: ValidateGripSigResult;
                beforeEach(async () => {
                    proxyStatus = await p.validateGripSig(null);
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
                    proxyStatus = await p.validateGripSig('value');
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
            let p: Publisher;
            beforeEach(async () => {
                p = new Publisher([
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
                    proxyStatus = await p.validateGripSig(null);
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
                    proxyStatus = await p.validateGripSig('value');
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

                    proxyStatus = await p.validateGripSig(token);
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
            let p: Publisher;
            beforeEach(async () => {
                p = new Publisher([
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
                    proxyStatus = await p.validateGripSig(null);
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
                    proxyStatus = await p.validateGripSig('value');
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

                    proxyStatus = await p.validateGripSig(token);
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

                    proxyStatus = await p.validateGripSig(token);
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
