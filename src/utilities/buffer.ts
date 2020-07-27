import { Buffer } from "buffer";

// Check if input is a buffer. If not, turn it into a string and then
// encode the bits of its UTF-8 representation into a new Buffer.
export function toBuffer(input: any): Buffer {
    return Buffer.isBuffer(input) ? input : Buffer.from(input.toString(), 'utf8');
}
