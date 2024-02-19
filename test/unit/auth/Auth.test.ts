import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Buffer } from 'node:buffer';

import jwt from 'jsonwebtoken';

import * as Auth from '../../../src/auth/index.js';

const textEncoder = new TextEncoder();

describe('auth', () => {
    describe('Basic', () => {
        it('test case', () => {
            const authBasic = new Auth.Basic("user", "pass");
            assert.equal(authBasic.user, "user");
            assert.equal(authBasic.pass, "pass");
            assert.equal(
                authBasic.buildHeader(),
                "Basic " + Buffer.from("user:pass").toString("base64")
            );
        });
    });
    describe('Bearer', () => {
        it('test case', () => {
            let authBearer = new Auth.Bearer("token");
            assert.equal(authBearer.token, "token");
            assert.equal(authBearer.buildHeader(), "Bearer token");
        });
    });
    describe('Jwt', () => {
        it('test case', async () => {
            const cl = {};
            let authJwt = new Auth.Jwt(cl, "key");
            assert.equal(authJwt.claim, cl);
            assert.deepStrictEqual(authJwt.key, textEncoder.encode("key"));
            authJwt = new Auth.Jwt({ iss: "hello" }, "key==");
            const claim = jwt.verify(authJwt.buildHeader().slice(7), "key==");
            assert.ok(typeof claim === 'object');
            assert.ok("exp" in claim);
            assert.equal(claim["iss"], "hello");
        });
    });
});
