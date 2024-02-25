export interface IExportedResponse {
    code?: string;
    reason?: string;
    headers?: Record<string, string>;
    body?: string;
    'body-bin'?: string;
}
