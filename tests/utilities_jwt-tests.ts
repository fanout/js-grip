import assert from "assert";
import jwt from "jwt-simple";

import { validateSig } from "../src/utilities/jwt";

describe('utilities/jwt', function () {
    describe('#validateSig', function () {
        it('check that a signature can be validated', function() {
            const token = jwt.encode({
                'claim': 'hello',
                'exp': new Date().getTime() / 1000 + 3600
            }, 'key==');
            assert(validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if it's expired", function() {
            const token = jwt.encode({
                'claim': 'hello',
                'exp': new Date().getTime() / 1000 - 3600
            }, 'key==');
            assert(!validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if the key doesn't match", function() {
            const token = jwt.encode({
                'claim': 'hello',
                'exp': new Date().getTime() / 1000 + 3600
            }, 'key==');
            assert(!validateSig(token, 'key==='));
        });
    });
});
