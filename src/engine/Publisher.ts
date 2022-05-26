import { PublisherTransport } from "./PublisherTransport";
import { PublisherBase } from "./PublisherBase";
import { IGripConfig } from "./IGripConfig";
import { IGripConfigBase } from "./IGripConfigBase";
import { PublisherClient } from "./PublisherClient";

export class Publisher extends PublisherBase<IGripConfig> {
  override additionalParseGripUri(parsed: IGripConfigBase, _uri: string): IGripConfig {
    return parsed;
  }

  buildPublisherClient(config: IGripConfig): PublisherClient {
    const { control_uri: uri } = config;
    const transport = new PublisherTransport(uri);
    return new PublisherClient(transport);
  }
}
