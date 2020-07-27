// Determines whether the specified object is a string.
const objectToString = Object.prototype.toString;
const stringObjectIdentifier = objectToString.call('');
export function isString(obj: any): obj is string {
    return obj != null && objectToString.call(obj) === stringObjectIdentifier;
}

export function encodeCString(str: string) {
    let output = '';
    for (const c of str) {
        if (c === '\\') {
            output += '\\\\';
        } else if (c === '\r') {
            output += '\\r';
        } else if (c === '\n') {
            output += '\\n';
        } else if (c === '\t') {
            output += '\\t';
        } else if (c.charCodeAt(0) < 0x20) {
            throw new Error("can't encode");
        } else {
            output += c;
        }
    }
    return output;
}

export function escapeQuotes(str: string) {
    let output = '';
    for (const c of str) {
        if (c === '"') {
            output += '\\"';
        } else {
            output += c;
        }
    }
    return output;
}
