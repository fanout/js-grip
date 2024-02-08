import { PublisherTransport } from './PublisherTransport.js';
import { PublisherBase } from './PublisherBase.js';
import { IGripConfig } from './IGripConfig.js';
import { PublisherClient } from './PublisherClient.js';

export class Publisher extends PublisherBase<IGripConfig> {
  buildPublisherClient(config: IGripConfig): PublisherClient {
    const { control_uri: uri } = config;
    const transport = new PublisherTransport(uri);
    return new PublisherClient(transport);
  }
}
