// The authorization interface for building auth headers in conjunction
// with HTTP requests used for publishing messages.
export interface IAuth {
    // This method should return the auth header in text format.
    buildHeader(): Promise<string>;
}
