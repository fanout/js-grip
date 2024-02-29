import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as jose from 'jose';
import * as Auth from '../../../src/auth/index.js';
import { encodeBytesToBase64String } from '../../../src/index.js';

const textEncoder = new TextEncoder();

describe('auth', () => {
    describe('Basic', () => {
        it('can be instantiated and can generate an appropriate header', async () => {
            const authBasic = new Auth.Basic('user', 'pass');
            assert.strictEqual(authBasic.getUser(), 'user');
            assert.strictEqual(authBasic.getPass(), 'pass');
            assert.strictEqual(
                await authBasic.buildHeader(),
                `Basic ${encodeBytesToBase64String(textEncoder.encode('user:pass'))}`
            );
        });
    });
    describe('Bearer', () => {
        it('can be instantiated and can generate an appropriate header', async () => {
            let authBearer = new Auth.Bearer('token');
            assert.strictEqual(authBearer.getToken(), 'token');
            assert.strictEqual(await authBearer.buildHeader(), 'Bearer token');
        });
    });
    describe('Jwt', () => {
        it('can be instantiated and can generate an appropriate header', async () => {
            const cl = {};
            let authJwt = new Auth.Jwt(cl, textEncoder.encode('key'));
            assert.strictEqual(authJwt.getClaim(), cl);
            assert.deepStrictEqual(authJwt.getKey(), textEncoder.encode('key'));

            authJwt = new Auth.Jwt({ iss: 'hello' }, textEncoder.encode('key=='));
            const claim = await jose.jwtVerify(
              (await authJwt.buildHeader()).slice(7),
              textEncoder.encode('key==')
            );

            assert.ok(claim.payload.exp != null);
            assert.strictEqual(claim.payload.iss, 'hello');
        });
    });
});
