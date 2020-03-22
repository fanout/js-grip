import { Buffer } from 'buffer';
import * as querystring from "querystring";

const objectToString = Object.prototype.toString;

// Determines whether the specified object is a function.
const functionObjectIdentifier = objectToString.call(function(){});
export function isFunction(obj: any): obj is Function {
    return obj != null && objectToString.call(obj) === functionObjectIdentifier;
}

// Determines whether the specified object is a string.
const stringObjectIdentifier = objectToString.call('');
export function isString(obj: any): obj is string {
    return obj != null && objectToString.call(obj) === stringObjectIdentifier;
}

// Check if input is a buffer. If not, turn it into a string and then
// encode the bits of its UTF-8 representation into a new Buffer.
export function toBuffer(input: any): Buffer {
    return Buffer.isBuffer(input) ? input : Buffer.from(input.toString(), 'utf8');
}

export function parseQueryString(query: string): { [key:string]: string } {

    // HACK: work around '+' character in base64-encoded values
    query = query.replace(/\+/g, '%2B');
    const paramsObj = querystring.parse(query);

    // HACK: flatten parsed query string
    const params = {};
    for (const [key, val] of Object.entries(paramsObj)) {
        if (Array.isArray(val)) {
            params[key] = val[0];
        } else {
            params[key] = val;
        }
    }

    return params;
}