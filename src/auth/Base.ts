import IAuth from './IAuth';

// The authorization base class for building auth headers in conjunction
// with HTTP requests used for publishing messages.
export default abstract class Base implements IAuth {
    // This method should return the auth header in text format.
    abstract buildHeader(): string;
}
