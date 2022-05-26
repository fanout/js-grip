import * as assert from "assert";
import * as jwt from "jsonwebtoken";

import { Auth } from '../src';

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
    describe('Jwt', function () {
        it('test case', function () {
            const cl = {};
            let authJwt = new Auth.Jwt(cl, "key");
            assert.equal(authJwt.claim, cl);
            assert.equal(authJwt.key, "key");
            assert.ok(Buffer.isBuffer(authJwt.key));
            assert.equal(authJwt.token, null);
            authJwt = new Auth.Jwt("token");
            assert.equal(authJwt.claim, null);
            assert.equal(authJwt.key, null);
            assert.equal(authJwt.token, "token");
            assert.equal(authJwt.buildHeader(), "Bearer token");
            const testToken = jwt.sign({ iss: "hello", exp: 1426106601 }, "key==", { noTimestamp: true });
            authJwt = new Auth.Jwt(testToken);
            assert.equal(
                authJwt.buildHeader(),
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
                "eyJpc3MiOiJoZWxsbyIsImV4cCI6MTQyNjEwNjYwMX0." +
                "qmFVZ3iS041fAhqHno0vYLykNycT40ntBuD3G7ISDJw"
            );
            authJwt = new Auth.Jwt({ iss: "hello" }, "key==");
            const claim = jwt.verify(authJwt.buildHeader().substring(7), "key==") as object;
            assert.ok("exp" in claim);
            assert.equal(claim["iss"], "hello");
        });
    });
});
