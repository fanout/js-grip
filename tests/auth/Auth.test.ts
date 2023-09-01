import * as assert from "assert";
import * as jwt from "jsonwebtoken";

import { Auth } from '../../src';

describe('auth', function () {
    describe('Basic', function () {
        it('test case', function () {
            const authBasic = new Auth.Basic("user", "pass");
            assert.equal(authBasic.user, "user");
            assert.equal(authBasic.pass, "pass");
            assert.equal(
                authBasic.buildHeader(),
                "Basic " + Buffer.from("user:pass").toString("base64")
            );
        });
    });
    describe('Bearer', function () {
        it('test case', function () {
            let authBearer = new Auth.Bearer("token");
            assert.equal(authBearer.token, "token");
            assert.equal(authBearer.buildHeader(), "Bearer token");
        });
    });
    describe('Jwt', function () {
        it('test case', function () {
            const cl = {};
            let authJwt = new Auth.Jwt(cl, "key");
            assert.equal(authJwt.claim, cl);
            assert.equal(authJwt.key, "key");
            assert.ok(Buffer.isBuffer(authJwt.key));
            authJwt = new Auth.Jwt({ iss: "hello" }, "key==");
            const claim = jwt.verify(authJwt.buildHeader().substring(7), "key==") as object;
            assert.ok("exp" in claim);
            assert.equal(claim["iss"], "hello");
        });
    });
});
