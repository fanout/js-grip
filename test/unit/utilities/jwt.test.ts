import { describe, it } from 'node:test';
import assert from 'node:assert';

import * as jose from 'jose';

import { validateSig } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('utilities/jwt', () => {
    describe('#validateSig', () => {
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
});
