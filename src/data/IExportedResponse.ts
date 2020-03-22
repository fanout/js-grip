export default interface IExportedResponse {
    code?: string;
    reason?: string;
    headers?: object;
    body?: string;
    'body-bin'?: string;
}
