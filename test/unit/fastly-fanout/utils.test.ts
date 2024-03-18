import { describe, it } from 'node:test';
import assert from 'node:assert';

import { type IGripConfig } from '../../../src/index.js';
import { PUBLIC_KEY_FASTLY_FANOUT_JWK } from '../../../src/fastly-fanout/keys.js';
import { buildFanoutGripConfig, buildFanoutGripUrl } from '../../../src/fastly-fanout/utils.js';

describe('buildFanoutGripConfig', () => {

    it('can build a GRIP Config with just service ID and API token', () => {
        const gripConfig = buildFanoutGripConfig({
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
        });
        const expected: IGripConfig = {
            control_uri: 'https://api.fastly.com/service/SERVICE_ID',
            key: 'API_TOKEN',
            verify_iss: 'fastly:SERVICE_ID',
            verify_key: JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK),
        };
        assert.deepStrictEqual(gripConfig, expected);
    });

    it('can build a GRIP Config with overridden baseURL', () => {
        const gripConfig = buildFanoutGripConfig({
            baseUrl: 'https://www.example.com/path/to/base',
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
        });
        const expected: IGripConfig = {
            control_uri: 'https://www.example.com/path/to/base',
            key: 'API_TOKEN',
            verify_iss: 'fastly:SERVICE_ID',
            verify_key: JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK),
        };
        assert.deepStrictEqual(gripConfig, expected);
    });

    it('can build a GRIP Config with overridden verify_iss', () => {
        const gripConfig = buildFanoutGripConfig({
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
            verifyIss: 'foo',
        });
        const expected: IGripConfig = {
            control_uri: 'https://api.fastly.com/service/SERVICE_ID',
            key: 'API_TOKEN',
            verify_iss: 'foo',
            verify_key: JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK),
        };
        assert.deepStrictEqual(gripConfig, expected);
    });

    it('can build a GRIP Config with overridden verify_key', () => {
        const gripConfig = buildFanoutGripConfig({
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
            verifyKey: 'foo',
        });
        const expected: IGripConfig = {
            control_uri: 'https://api.fastly.com/service/SERVICE_ID',
            key: 'API_TOKEN',
            verify_iss: 'fastly:SERVICE_ID',
            verify_key: 'foo',
        };
        assert.deepStrictEqual(gripConfig, expected);
    });

});

describe('buildFanoutGripUrl', () => {

    it('can build a GRIP_URL with just service ID and API token', () => {
        const gripUrl = buildFanoutGripUrl({
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
        });
        const expected = 'https://api.fastly.com/service/SERVICE_ID' +
            '?key=API_TOKEN&verify-iss=fastly%3ASERVICE_ID' +
            '&verify-key=' + encodeURIComponent(JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK));
        assert.strictEqual(gripUrl, expected);
    });

    it('can build a GRIP_URL with overridden baseURL', () => {
        const gripUrl = buildFanoutGripUrl({
            baseUrl: 'https://www.example.com/path/to/base',
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
        });
        const expected = 'https://www.example.com/path/to/base' +
            '?key=API_TOKEN&verify-iss=fastly%3ASERVICE_ID' +
            '&verify-key=' + encodeURIComponent(JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK));
        assert.strictEqual(gripUrl, expected);
    });

    it('can build a GRIP_URL with overridden verify_iss', () => {
        const gripUrl = buildFanoutGripUrl({
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
            verifyIss: 'foo',
        });
        const expected = 'https://api.fastly.com/service/SERVICE_ID' +
            '?key=API_TOKEN&verify-iss=foo' +
            '&verify-key=' + encodeURIComponent(JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK));
        assert.strictEqual(gripUrl, expected);
    });

    it('can build a GRIP_URL with overridden verify_key', () => {
        const gripUrl = buildFanoutGripUrl({
            serviceId: 'SERVICE_ID',
            apiToken: 'API_TOKEN',
            verifyKey: 'foo',
        });
        const expected = 'https://api.fastly.com/service/SERVICE_ID' +
            '?key=API_TOKEN&verify-iss=fastly%3ASERVICE_ID' +
            '&verify-key=foo';
        assert.strictEqual(gripUrl, expected);
    });

});
