import * as jose from 'jose';

// The authorization interface for building auth headers in conjunction
// with HTTP requests used for publishing messages.
export interface IAuth {
    // This method should return the auth header in text format.
    buildHeader(): Promise<string>;
    // This method can optionally provide a verify key.
    getVerifyKey?: () => Promise<Uint8Array | jose.KeyLike>;
}
