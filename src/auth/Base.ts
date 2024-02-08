import { IAuth } from './IAuth.js';

// The authorization base class for building auth headers in conjunction
// with HTTP requests used for publishing messages.
export abstract class Base implements IAuth {
    // This method should return the auth header in text format.
    abstract buildHeader(): string;
}
