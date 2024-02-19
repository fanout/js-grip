import { IGripConfigBase } from '../engine/index.js';
import { Channel } from '../data/index.js';
import { decodeBytesFromBase64String } from './base64.js';

// Method for parsing the specified parameter into an
// array of Channel instances. The specified parameter can either
// be a string, a Channel instance, or an array of Channel instances.
export function parseChannels(inChannels: Channel | Channel[] | string | string[]) {
    const channels = !Array.isArray(inChannels) ? [inChannels] : inChannels;
    return channels.map((channel) => typeof channel === 'string' ? new Channel(channel) : channel);
}

// Parse the specified GRIP URI into a config object that can then be passed
// to the PublisherBase class. The URI can include 'iss' and 'key' JWT
// authentication query parameters as well as any other required query string
// parameters. The JWT 'key' query parameter can be provided as-is or in base64
// encoded format.
export function parseGripUri(uri: string) {
  return parseGripUriCustomParams<IGripConfigBase>(uri);
}

export function parseGripUriCustomParams<
  TGripConfig extends IGripConfigBase,
  TContext = Record<string, unknown>,
>(
  uri: string,
  fnParamsToContext?: (params: URLSearchParams) => TContext,
  fnContextToOut?: (configBase: IGripConfigBase, ctx: TContext) => TGripConfig
): TGripConfig {
    const parsedUrl = new URL(uri);
    const params = parsedUrl.searchParams;

    let iss: string | null = null;
    let key: Uint8Array | string | null = null;

    let verify_iss: string | null = null;
    let verify_key: Uint8Array | string | null = null;

    if (params.has('iss')) {
        iss = params.get('iss');
        params.delete('iss');
    }
    if (params.has('key')) {
        key = params.get('key');
        params.delete('key');
    }
    if (params.has('verify-iss')) {
        verify_iss = params.get('verify-iss');
        params.delete('verify-iss');
    }
    if (params.has('verify-key')) {
        verify_key = params.get('verify-key');
        params.delete('verify-key');
    }

    const ctx: TContext | null = fnParamsToContext != null ? fnParamsToContext(params) : null;

    if (typeof key === 'string' && key.startsWith('base64:')) {
        key = key.slice(7);
        // When the key contains a '+' character, if the URL is built carelessly
        // and this segment of the URL contained '+' directly instead of properly
        // being URL-encoded as %2B, then they would have turned into spaces at
        // this point. Turn them back into pluses before decoding the key from base64.
        key = key.replace(/ /g, '+');
        key = decodeBytesFromBase64String(key);
    }
    if (typeof verify_key === 'string' && verify_key.startsWith('base64:')) {
        verify_key = verify_key.slice(7);
        // When the key contains a '+' character, if the URL is built carelessly
        // and this segment of the URL contained '+' directly instead of properly
        // being URL-encoded as %2B, then they would have turned into spaces at
        // this point. Turn them back into pluses before decoding the key from base64.
        verify_key = verify_key.replace(/ /g, '+');
        verify_key = decodeBytesFromBase64String(verify_key);
    }

    if (parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, parsedUrl.pathname.length - 1);
    }
    let controlUri = parsedUrl.toString();

    const configBase: IGripConfigBase = { control_uri: controlUri };
    if (iss != null) {
        configBase['control_iss'] = iss;
    }
    if (key != null) {
        configBase['key'] = key;
    }
    if (verify_iss != null) {
        configBase['verify_iss'] = verify_iss;
    }
    if (verify_key != null) {
        configBase['verify_key'] = verify_key;
    }
    let out: TGripConfig;
    if(fnContextToOut != null && ctx != null) {
        out = fnContextToOut(configBase, ctx);
    } else {
        out = configBase as TGripConfig;
    }
    return out;
}

// Create a GRIP channel header for the specified channels. The channels
// parameter can be specified as a string representing the channel name,
// a Channel instance, or an array of Channel instances. The returned GRIP
// channel header is used when sending instructions to GRIP proxies via
// HTTP headers.
export function createGripChannelHeader(channels: Channel | Channel[] | string | string[]) {
    channels = parseChannels(channels);
    const parts = [];
    for (const channel of channels) {
        const channelExport = channel.export();
        let s = channelExport.name;
        if (channelExport.prevId) {
            s += '; prev-id=' + channelExport.prevId;
        }
        parts.push(s);
    }
    return parts.join(', ');
}
