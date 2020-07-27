import { Buffer } from "buffer";
import * as querystring from "querystring";
import * as url from "url";

import Channel from "../data/Channel";
import { parseQueryString, } from "./http";
import { isString, } from "./string";

// An internal method for parsing the specified parameter into an
// array of Channel instances. The specified parameter can either
// be a string, a Channel instance, or an array of Channel instances.
export function parseChannels(inChannels: Channel | Channel[] | string | string[]) {
    const channels = !Array.isArray(inChannels) ? [inChannels] : inChannels;
    return channels.map(channel => isString(channel) ? new Channel(channel) : channel);
}

// Parse the specified GRIP URI into a config object that can then be passed
// to the Publisher class. The URI can include 'iss' and 'key' JWT
// authentication query parameters as well as any other required query string
// parameters. The JWT 'key' query parameter can be provided as-is or in base64
// encoded format.
export function parseGripUri(uri: string) {
    const parsedUri = url.parse(uri);
    let iss: string | null = null;
    let key: Buffer | string | null = null;

    const params = parseQueryString(parsedUri.query || '');
    if ('iss' in params) {
        iss = params['iss'];
        delete params['iss'];
    }
    if ('key' in params) {
        key = params['key'];
        delete params['key'];
    }
    if (key != null && isString(key) && key.startsWith('base64:')) {
        key = Buffer.from(key.substring(7), 'base64');
    }
    const qs = querystring.stringify(params);
    let path = parsedUri.pathname;
    if (path != null && path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    let controlUri = parsedUri.protocol + '//' + parsedUri.host + path;
    if (qs != null && qs !== '') {
        controlUri = controlUri + '?' + qs;
    }
    const out = {'control_uri': controlUri};
    if (iss) {
        out['control_iss'] = iss;
    }
    if (key) {
        out['key'] = key;
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
