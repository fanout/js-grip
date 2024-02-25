import {
  getWebSocketContextImpl,
  isWsOverHttpImpl
} from '../../utilities/index.js';
import type { IncomingMessage, IncomingHttpHeaders } from 'node:http';

function headersFromNodeIncomingHttpHeaders(incomingHttpHeaders: IncomingHttpHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(incomingHttpHeaders)) {
    if (value == null) {
      continue;
    }
    if (!Array.isArray(value)) {
      headers.append(key, value);
      continue;
    }
    // Should only be for set-cookie
    // https://nodejs.org/api/http.html#messageheaders
    for (const entry of value) {
      headers.append(key, entry);
    }
  }

  return headers;
}

export function isNodeReqWsOverHttp(req: IncomingMessage) {
  return isWsOverHttpImpl(req.method, headersFromNodeIncomingHttpHeaders(req.headers));
}

export async function getWebSocketContextFromNodeReq(req: IncomingMessage, prefix: string = '') {
  return getWebSocketContextImpl(
    headersFromNodeIncomingHttpHeaders(req.headers),
    async () => {
      return new Promise<Uint8Array>(resolve => {
        const bodyParts: Buffer[] = [];
        req.on('data', (chunk: string | Buffer) => {
          if (typeof chunk === 'string') {
            chunk = Buffer.from(chunk);
          }
          bodyParts.push(chunk);
        });
        req.on('end', () => {
          const body = Buffer.concat(bodyParts);
          resolve(body);
        });
      });
    },
    prefix
  );
}
