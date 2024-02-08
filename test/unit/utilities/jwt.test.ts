import { describe, it } from 'node:test';
import assert from 'node:assert';

import jwt from 'jsonwebtoken';

import { validateSig } from '../../../src/index.js';

describe('utilities/jwt', () => {
    describe('#validateSig', () => {
        it('check that a signature can be validated', () => {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if it's expired", () => {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '-1h',
            });
            assert.ok(!validateSig(token, 'key=='));
        });
        it("check that a signature can't be validated if the key doesn't match", () => {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(!validateSig(token, 'key==='));
        });
        it("check the ISS of a claim", () => {
            const token = jwt.sign({
                'claim': 'hello',
                'iss': 'foo',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(validateSig(token, 'key==', 'foo'));
        });
        it("check claim with missing ISS won't validate", () => {
            const token = jwt.sign({
                'claim': 'hello',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(!validateSig(token, 'key==', 'foo'));
        });
        it("check claim with mismatched ISS won't validate", () => {
            const token = jwt.sign({
                'claim': 'hello',
                'iss': 'bar',
            }, 'key==', {
                expiresIn: '1h',
            });
            assert.ok(!validateSig(token, 'key==', 'foo'));
        });
    });
});
