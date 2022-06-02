import { PublisherTransport } from "./PublisherTransport";
import { PublisherBase } from "./PublisherBase";
import { IGripConfig } from "./IGripConfig";
import { PublisherClient } from "./PublisherClient";

export class Publisher extends PublisherBase<IGripConfig> {
  buildPublisherClient(config: IGripConfig): PublisherClient {
    const { control_uri: uri } = config;
    const transport = new PublisherTransport(uri);
    return new PublisherClient(transport);
  }
}
