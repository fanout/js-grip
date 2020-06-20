import assert from "assert";
import jwt from "jwt-simple";

import auth from '../src/auth/index';

describe('auth', function () {
    describe('Basic', function () {
        it('test case', function () {
            const authBasic = new auth.Basic("user", "pass");
            assert.equal(authBasic.user, "user");
            assert.equal(authBasic.pass, "pass");
            assert.equal(
                authBasic.buildHeader(),
                "Basic " + Buffer.from("user:pass").toString("base64")
            );
        });
    });
    describe('Jwt', function () {
        it('test case', function () {
            const cl = {};
            let authJwt = new auth.Jwt(cl, "key");
            assert.equal(authJwt.claim, cl);
            assert.equal(authJwt.key, "key");
            assert(Buffer.isBuffer(authJwt.key));
            assert.equal(authJwt.token, null);
            authJwt = new auth.Jwt("token");
            assert.equal(authJwt.claim, null);
            assert.equal(authJwt.key, null);
            assert.equal(authJwt.token, "token");
            assert.equal(authJwt.buildHeader(), "Bearer token");
            authJwt = new auth.Jwt({ iss: "hello", exp: 1426106601 }, "key==");
            assert.equal(
                authJwt.buildHeader(),
                "Bearer eyJ0eXAiOiJKV1QiLCJhbG" +
                "ciOiJIUzI1NiJ9.eyJpc3MiOiJoZWxsbyIsImV4cCI6MT" +
                "QyNjEwNjYwMX0.beCyAv3kUlIYomos527H1HrzKJbgSGewQjYzoAv0XNo"
            );
            authJwt = new auth.Jwt({ iss: "hello" }, "key==");
            const claim = jwt.decode(authJwt.buildHeader().substring(7), "key==");
            assert("exp" in claim);
            assert.equal(claim["iss"], "hello");
        });
    });
});
