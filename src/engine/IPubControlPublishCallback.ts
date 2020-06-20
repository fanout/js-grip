export default interface IPubControlPublishCallback {
    (status: boolean, message?: string, context?: any): void;
}
