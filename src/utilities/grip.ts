import { Channel } from '../data/index.js';
import { type IGripConfig } from '../engine/index.js';

// Method for parsing the specified parameter into an
// array of Channel instances. The specified parameter can either
// be a string, a Channel instance, or an array of Channel instances.
export function parseChannels(inChannels: Channel | Channel[] | string | string[]) {
    const channels = !Array.isArray(inChannels) ? [inChannels] : inChannels;
    return channels.map((channel) => typeof channel === 'string' ? new Channel(channel) : channel);
}

// Parses the specified GRIP URI into a config object that can then be passed
// to the Publisher class. The URI can include query parameters for authentication
// during publishing as well as those used for verifying the signature of incoming
// requests.
// Additional values can be provided that get merged with query parameters
// before parsing them. This is useful for values that get particularly long,
// such as JWT_VERIFY_KEY.
export function parseGripUri(uri: string, additional?: Record<string, string | undefined>) {
    const parsedUrl = new URL(uri);
    const params = parsedUrl.searchParams;

    if (additional != null) {
        for (const [key, value] of Object.entries(additional)) {
            if (value === undefined) {
                continue;
            }
            params.set(key, value);
        }
    }

    let user: string | null = null;
    let pass: string | null = null;
    if (parsedUrl.username !== '') {
        user = parsedUrl.username;
        parsedUrl.username = '';
    }
    if (parsedUrl.password !== '') {
        pass = parsedUrl.password;
        parsedUrl.password = '';
    }

    let iss: string | null = null;
    let key: string | null = null;

    let verify_iss: string | null = null;
    let verify_key: string | null = null;

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

    if (parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, parsedUrl.pathname.length - 1);
    }
    let controlUri = parsedUrl.toString();

    const gripConfig: IGripConfig = { control_uri: controlUri };
    if (iss != null) {
        gripConfig['control_iss'] = iss;
    }
    if (user != null) {
        gripConfig['user'] = user;
    }
    if (pass != null) {
        gripConfig['pass'] = pass;
    }
    if (key != null) {
        gripConfig['key'] = key;
    }
    if (verify_iss != null) {
        gripConfig['verify_iss'] = verify_iss;
    }
    if (verify_key != null) {
        gripConfig['verify_key'] = verify_key;
    }

    return gripConfig;
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
