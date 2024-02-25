import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ConnectionIdMissingException,
  getWebSocketContextFromReq,
  isWsOverHttp,
  WebSocketDecodeEventException
} from "../../../src/index.js";

describe('isWsOverHttp', () => {

  let req: Request;

  beforeEach(() => {
    req = new Request(
      'https://www.example.com',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/websocket-events',
          'Accept': 'application/websocket-events',
        }
      },
    );
  });

  it("returns true for normal case", () => {

    assert.ok(isWsOverHttp(req));

  });

  it("returns false if method isn't POST", () => {

    const getReq = new Request(
      req,
      {
        method: 'GET'
      }
    );

    assert.ok(!isWsOverHttp(getReq));

    const putReq = new Request(
      req,
      {
        method: 'PUT'
      }
    );

    assert.ok(!isWsOverHttp(putReq));

  });

  it("returns false if Content-Type header is not 'application/websocket-events'", () => {

    req.headers.set('content-type', 'text/plain');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('content-type', 'text/html');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('content-type', 'application/json');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('content-type', 'image/jpeg');
    assert.ok(!isWsOverHttp(req));

  });

  it("returns false if Accept header doesn't include 'application/websocket-events'", () => {

    req.headers.set('accept', 'text/plain');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('accept', 'text/html');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('accept', 'application/json');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('accept', 'image/jpeg');
    assert.ok(!isWsOverHttp(req));

    req.headers.set('accept', 'application/json, application/websocket-events');
    assert.ok(isWsOverHttp(req));

    req.headers.set('accept', 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8');
    assert.ok(isWsOverHttp(req));

  });

});

describe('getWebSocketContextFromReq', () => {
  let req: Request;

  beforeEach(() => {
    req = new Request(
      "https://www.example.com",
      {
        method: 'POST',
        headers: {
          'Connection-id': '1234',
          'Content-Type': 'application/websocket-events',
          'Accept': 'application/websocket-events',
          'Meta-foo': 'bar',
        },
        body: 'OPEN\r\nTEXT 5\r\nHello\r\nTEXT 0\r\n\r\nCLOSE\r\nTEXT\r\nCLOSE\r\n',
      }
    );
  });

  it('Can build a WebSocketContext', async () => {

    const ws = await getWebSocketContextFromReq(req);

    assert.strictEqual(ws.id, '1234');
    assert.ok(ws.isOpening());
    assert.ok(ws.canRecv());
    assert.strictEqual(ws.meta['foo'], 'bar');

    let msg: string | null;
    msg = ws.recv();
    assert.strictEqual(msg, 'Hello');
    msg = ws.recv();
    assert.strictEqual(msg, '');
    msg = ws.recv();
    assert.strictEqual(msg, null);

  });

  it('Fails if connection ID is not present', async () => {
    req.headers.delete('connection-id');

    await assert.rejects(async () => {
      await getWebSocketContextFromReq(req);
    }, err => {
      assert.ok(err instanceof ConnectionIdMissingException);
      return true;
    });
  });

  it("Fails if body has bad format", async () => {

    // Should be possible to write this, but broken in node < 21:
    // req = new Request(req, {
    //   body: 'foobar'
    // });
    req = new Request(
      "https://www.example.com",
      {
        method: 'POST',
        headers: {
          'Connection-id': '1234',
          'Content-Type': 'application/websocket-events',
          'Accept': 'application/websocket-events',
          'Meta-foo': 'bar',
        },
        body: 'foobar',
      }
    );
    await assert.rejects(async () => {
      await getWebSocketContextFromReq(req);
    }, err => {
      assert.ok(err instanceof WebSocketDecodeEventException);
      return true;
    });
  });

});
