import debug from './debug.js';
import { ConnectionIdMissingException, WebSocketContext, WebSocketDecodeEventException } from '../data/index.js';
import { decodeWebSocketEvents } from './webSocketEvents.js';

export const CONTENT_TYPE_APPLICATION = 'application';
export const CONTENT_SUBTYPE_WEBSOCKET_EVENTS = 'websocket-events';

export const CONTENT_TYPE_WEBSOCKET_EVENTS = `${CONTENT_TYPE_APPLICATION}/${CONTENT_SUBTYPE_WEBSOCKET_EVENTS}`;

export function isWsOverHttpImpl(method: string | undefined, headers: Headers) {
  if (method !== 'POST') {
    return false;
  }

  let contentTypeHeader = headers.get('content-type');
  if (contentTypeHeader != null) {
    const at = contentTypeHeader.indexOf(';');
    if (at >= 0) {
      contentTypeHeader = contentTypeHeader.slice(0, at);
    }
    contentTypeHeader = contentTypeHeader.trim();
    debug('content-type header', contentTypeHeader);
  } else {
    debug('content-type header not present');
  }

  if (contentTypeHeader !== CONTENT_TYPE_WEBSOCKET_EVENTS) {
    return false;
  }

  const acceptTypesHeader = headers.get('accept');

  if (acceptTypesHeader == null) {
    debug('accept header not present');
    return false;
  }
  debug('accept header', acceptTypesHeader);

  for (let acceptType of acceptTypesHeader.split(',')) {
    const at = acceptType.indexOf(';');
    if (at >= 0) {
      acceptType = acceptType.slice(0, at);
    }
    acceptType = acceptType.trim();
    if (
      acceptType === '*/*' ||
      acceptType === `${CONTENT_TYPE_APPLICATION}/*` ||
      acceptType === CONTENT_TYPE_WEBSOCKET_EVENTS
    ) {
      return true;
    }
  }

  return false;
}

export async function getWebSocketContextImpl(headers: Headers, getBody: () => Promise<Uint8Array>, prefix: string) {

  const cid = headers.get('connection-id');
  if (cid == null) {
    throw new ConnectionIdMissingException();
  }

  debug('Connection ID', cid);

  // Handle meta keys
  debug('Handling Meta - start');
  const meta: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    const lKey = key.toLowerCase();
    if (lKey.startsWith('meta-')) {
      const k = lKey.slice(5);
      meta[k] = value;
      debug(k, '=', value);
    }
  }
  debug('Handling Meta - end');

  const body = await getBody();


  debug('Decode body - start');
  let events = null;
  try {
    events = decodeWebSocketEvents(body);
  } catch (err) {
    throw new WebSocketDecodeEventException();
  }
  debug('Decode body - end');

  debug('Websocket Events', events);

  debug('Creating Websocket Context - start');
  const wsContext = new WebSocketContext(cid, meta, events, prefix);
  debug('Creating Websocket Context - end');

  return wsContext;
}

export function isWsOverHttp(req: Request) {
  return isWsOverHttpImpl(req.method, req.headers);
}

export async function getWebSocketContextFromReq(req: Request, prefix: string = '') {
  const getBody = async () => {
    const arrayBuffer = await req.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };
  return getWebSocketContextImpl(req.headers, getBody, prefix);
}
