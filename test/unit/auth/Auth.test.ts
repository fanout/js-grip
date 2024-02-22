import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';
import * as Auth from '../../../src/auth/index.js';
import { encodeBytesToBase64String } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('auth', () => {
    describe('Basic', () => {
        it('test case', async () => {
            const authBasic = new Auth.Basic("user", "pass");
            assert.equal(authBasic.getUser(), "user");
            assert.equal(authBasic.getPass(), "pass");
            assert.equal(
                await authBasic.buildHeader(),
                "Basic " + encodeBytesToBase64String(textEncoder.encode("user:pass"))
            );
        });
    });
    describe('Bearer', () => {
        it('test case', async () => {
            let authBearer = new Auth.Bearer("token");
            assert.equal(authBearer.getToken(), "token");
            assert.equal(await authBearer.buildHeader(), "Bearer token");
        });
    });
    describe('Jwt', () => {
        it('test case', async () => {
            const cl = {};
            let authJwt = new Auth.Jwt(cl, "key");
            assert.equal(authJwt.getClaim(), cl);
            assert.deepStrictEqual(await authJwt.getKey(), textEncoder.encode("key"));
            assert.deepStrictEqual(await authJwt.getVerifyKey(), textEncoder.encode("key"));

            authJwt = new Auth.Jwt({ iss: "hello" }, "key==");
            const claim = await jose.jwtVerify(
              (await authJwt.buildHeader()).slice(7),
              textEncoder.encode("key==")
            );

            assert.ok(claim.payload.exp != null);
            assert.equal(claim.payload.iss, 'hello');
        });
    });
});
