export interface IApiRequest<T> {
  getWrapped(): T;
  getMethod(): string | undefined;
  getHeaders(): Record<string, string>;
  getHeaderValue(key: string): string | undefined;
  getBody(): Promise<Uint8Array>;
}
