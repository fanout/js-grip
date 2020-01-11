import { Buffer } from 'buffer';

const objectToString = Object.prototype.toString;

// Determines whether the specified object is a function.
const functionObjectIdentifier = objectToString.call(function(){});
export function isFunction(obj) {
    return obj != null && objectToString.call(obj) === functionObjectIdentifier;
}

// Determines whether the specified object is a string.
const stringObjectIdentifier = objectToString.call('');
export function isString(obj) {
    return obj != null && objectToString.call(obj) === stringObjectIdentifier;
}

// Check if input is a buffer. If not, turn it into a string and then
// encode the bits of its UTF-8 representation into a new Buffer.
export function toBuffer(input) {
    return Buffer.isBuffer(input) ? input : Buffer.from(input.toString(), 'utf8');
}
