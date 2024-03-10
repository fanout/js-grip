import { PUBLIC_KEY_FASTLY_FANOUT_JWK } from './keys.js';
import { parseGripUri } from '../utilities/grip.js';

export type BuildFanoutGripConfigParams = {
    serviceId: string,                              // Fastly service of GRIP proxy
    apiToken: string,                               // API token that has 'global' scope on above service
    baseUrl?: URL | string,                         // (optional) Base URL
    verifyIss?: string,                             // (optional) Verify Issuer
    verifyKey?: string | JsonWebKey,                // (optional) Verify Key
};

export function buildFanoutGripConfig(params: BuildFanoutGripConfigParams) {
    const gripUrl = buildFanoutGripUrl(params);
    return parseGripUri(gripUrl);
}

export function buildFanoutGripUrl(params: BuildFanoutGripConfigParams) {
    const {
        serviceId,
        apiToken,
        baseUrl,
        verifyIss,
        verifyKey,
    } = params;

    const url = new URL(baseUrl ?? `https://api.fastly.com/service/${serviceId}`);
    url.searchParams.set('key', apiToken);
    url.searchParams.set('verify-iss', verifyIss ?? `fastly:${serviceId}`);

    let verifyKeyValue: string;
    if (typeof verifyKey === 'string') {
        verifyKeyValue = verifyKey;
    } else if (verifyKey != null) {
        verifyKeyValue = JSON.stringify(verifyKey);
    } else {
        verifyKeyValue = JSON.stringify(PUBLIC_KEY_FASTLY_FANOUT_JWK);
    }
    url.searchParams.set('verify-key', verifyKeyValue);

    return String(url);
}
