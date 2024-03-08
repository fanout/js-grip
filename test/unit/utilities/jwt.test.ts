import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';
import { validateSig } from '../../../src/index.js';
import {
    SAMPLEKEY_EC_PUBLIC_PEM,
    SAMPLEKEY_RSA_PRIVATE_PEM,
    SAMPLEKEY_RSA_PUBLIC_PEM,
} from '../sampleKeys.js';

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
            it('check that a signature can\'t be validated if it\'s expired', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('-1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key=='));
            });
            it('check that a signature can\'t be validated if the key doesn\'t match', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key==='));
            });
            it('check the ISS of a claim', async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'foo',
                  })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(await validateSig(token, 'key==', 'foo'));
            });
            it('check claim with missing ISS won\'t validate', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(textEncoder.encode('key=='));

                assert.ok(!await validateSig(token, 'key==', 'foo'));
            });
            it('check claim with mismatched ISS won\'t validate', async () => {

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
                privateKey1 = await jose.importPKCS8(SAMPLEKEY_RSA_PRIVATE_PEM, 'RS256');
            });
            it('check that a signature can be validated', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(await validateSig(token, SAMPLEKEY_RSA_PUBLIC_PEM));
            });
            it('check that a signature can be validated when the key is loaded beforehand', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                const publicKey1 = await jose.importSPKI(SAMPLEKEY_RSA_PUBLIC_PEM, 'RS256');

                assert.ok(await validateSig(token, publicKey1));
            });
            it('check that a signature can\'t be validated if it\'s expired', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('-1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, SAMPLEKEY_RSA_PUBLIC_PEM));
            });
            it('check that a signature can\'t be validated if the key doesn\'t match', async () => {

                const signJwt = new jose.SignJWT({ 'claim': 'hello' })
                  .setProtectedHeader({ alg: 'RS256' })
                  .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, SAMPLEKEY_EC_PUBLIC_PEM));
            });
            it('check the ISS of a claim', async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'foo',
                })
                    .setProtectedHeader({ alg: 'RS256' })
                    .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(await validateSig(token, SAMPLEKEY_RSA_PUBLIC_PEM, 'foo'));
            });
            it('check claim with missing ISS won\'t validate', async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                })
                    .setProtectedHeader({ alg: 'RS256' })
                    .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, SAMPLEKEY_RSA_PUBLIC_PEM, 'foo'));
            });
            it('check claim with mismatched ISS won\'t validate', async () => {

                const signJwt = new jose.SignJWT({
                    'claim': 'hello',
                    'iss': 'bar',
                })
                    .setProtectedHeader({ alg: 'RS256' })
                    .setExpirationTime('1h');
                const token = await signJwt.sign(privateKey1);

                assert.ok(!await validateSig(token, SAMPLEKEY_RSA_PUBLIC_PEM, 'foo'));
            });
        });
    });
});
