import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import * as jose from 'jose';
import { PRIVATE_KEY_1, PUBLIC_KEY_1, PUBLIC_KEY_FASTLY } from '../sampleKeys.js';

import { validateSig } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('utilities/jwt', () => {
    describe('#validateSig', () => {
        describe('Using HS256', () => {
            it('check that a signature can be validated', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(await validateSig(token, 'key=='));
            });
            it("check that a signature can't be validated if it's expired", async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('-1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key=='));
            });
            it("check that a signature can't be validated if the key doesn't match", async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key==='));
            });
            it("check the ISS of a claim", async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'foo',
                  })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(await validateSig(token, 'key==', 'foo'));
            });
            it("check claim with missing ISS won't validate", async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key==', 'foo'));
            });
            it("check claim with mismatched ISS won't validate", async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'bar',
                  })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key==', 'foo'));
            });
        });
        describe('Using RS256', () => {
            let privateKey1: jose.KeyLike;
            before(async () => {
                privateKey1 = await jose.importPKCS8(PRIVATE_KEY_1, 'RS256');
            });
            it('check that a signature can be validated', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(await validateSig(token, PUBLIC_KEY_1));
            });
            it('check that a signature can be validated when the key is loaded beforehand', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                const publicKey1 = await jose.importSPKI(PUBLIC_KEY_1, 'RS256');

                assert.ok(await validateSig(token, publicKey1));
            });
            it("check that a signature can't be validated if it's expired", async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('-1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, PUBLIC_KEY_1));
            });
            it("check that a signature can't be validated if the key doesn't match", async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, PUBLIC_KEY_FASTLY));
            });
            it("check the ISS of a claim", async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'foo',
                })
                    .setProtectedHeader({ alg: 'RS256' })
                    .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(await validateSig(token, PUBLIC_KEY_1, 'foo'));
            });
            it("check claim with missing ISS won't validate", async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                })
                    .setProtectedHeader({ alg: 'RS256' })
                    .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, PUBLIC_KEY_1, 'foo'));
            });
            it("check claim with mismatched ISS won't validate", async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'bar',
                })
                    .setProtectedHeader({ alg: 'RS256' })
                    .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, PUBLIC_KEY_1, 'foo'));
            });
        });
    });
});
