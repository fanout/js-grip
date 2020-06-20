export default interface IPublishCallback {
    (status: boolean, message?: string, context?: any): void;
}
