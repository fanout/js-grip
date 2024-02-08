import HttpAgent, { HttpsAgent } from 'agentkeepalive';

import { FetchResponse, IPublisherTransport, IReqHeaders } from './index.js';
import { PublishException } from '../data/index.js';

export class PublisherTransport implements IPublisherTransport {
  publishUri: string;
  _agent?: HttpAgent;

  constructor(uri: string) {
    // Initialize this class with a URL representing the publishing endpoint.
    const url = new URL(uri);
    if (!url.pathname.endsWith('/')) {
      // To avoid breaking previous implementation, if the URL does
      // not end in a slash then we add one.
      // e.g. if URI is 'https://www.example.com/foo' then the
      // publishing URI is 'https://www.example.com/foo/publish'
      url.pathname += '/';
    }
    this.publishUri = String(new URL('./publish/', url));
  }

  getAgent() {
    if(this._agent != null) {
      return this._agent;
    }
    const publishUri = new URL(this.publishUri);
    switch (publishUri.protocol) {
      case 'http:':
        this._agent = new HttpAgent();
        break;
      case 'https:':
        this._agent = new HttpsAgent();
        break;
      default :
        throw new PublishException('Bad URI', {statusCode: -2});
    }
    return this._agent;
  }

  async publish(headers: IReqHeaders, content: string): Promise<FetchResponse> {
    const reqParams = {
      method: 'POST',
      headers,
      body: content,
      agent: this.getAgent(),
    };
    return await fetch(this.publishUri, reqParams);
  }
}
