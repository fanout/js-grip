export interface IApiResponse<T> {
  getWrapped(): T;
  setStatus(code: number): void;
  end(chunk: string): void;
}
