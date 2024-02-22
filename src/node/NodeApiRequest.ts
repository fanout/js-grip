import debug from '../utilities/debug.js';
import { encodeBytesToBase64String, concatUint8Arrays } from '../utilities/index.js';
import type { IncomingMessage } from 'node:http';
import type { IApiRequest } from './IApiRequest.js';

const textEncoder = new TextEncoder();

export class NodeApiRequest implements IApiRequest<IncomingMessage> {
  static _map = new WeakMap<IncomingMessage, IApiRequest<IncomingMessage>>();

  static for(req: IncomingMessage): IApiRequest<IncomingMessage> {
    let apiRequest = this._map.get(req);
    if(apiRequest != null) {
      return apiRequest;
    }

    apiRequest = new NodeApiRequest(req);
    this._map.set(req, apiRequest);
    return apiRequest;
  }

  private _body?: Uint8Array;
  constructor(private _req: IncomingMessage) {}

  getWrapped(): IncomingMessage {
    return this._req;
  }

  getMethod(): string | undefined {
    return this._req.method;
  }

  async getBody(): Promise<Uint8Array> {
    if(this._body != null) {
      debug("Reading body - body already known, returning it");
      return this._body;
    }
    debug("Reading body - start");
    const body = await new Promise<Uint8Array>((resolve) => {
      const bodySegments: Uint8Array[] = [];
      this._req.on('data', (chunk: Uint8Array | string) => {
        if (!(chunk instanceof Uint8Array)) {
          chunk = textEncoder.encode(chunk);
        }
        bodySegments.push(chunk);
      });
      this._req.on('end', () => {
        const bodyBuffer = concatUint8Arrays(...bodySegments);
        resolve(bodyBuffer);
      });
    });
    this._body = body;
    if (body != null) {
      debug("body (Uint8Array)", encodeBytesToBase64String(body));
    } else {
      debug("body is null");
    }
    debug("Reading body - end");
    return this._body;
  }

  getHeaderValue(key: string): string | undefined {
    let value = this._req.headers[key];
    if(Array.isArray(value)) {
      value = value[0];
    }
    return value;
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    for(const key of Object.keys(this._req.headers)) {
      const value = this.getHeaderValue(key);
      if(value != null) {
        headers[key.toLowerCase()] = value;
      }
    }
    return headers;
  }
}
