import { FetchResponse, IPublisherTransport, IReqHeaders } from './index.js';

export class PublisherTransport implements IPublisherTransport {
  publishUri: string;

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

  async publish(headers: IReqHeaders, content: string): Promise<FetchResponse> {
    const reqParams = {
      method: 'POST',
      headers,
      body: content,
    };
    return await fetch(this.publishUri, reqParams);
  }
}
