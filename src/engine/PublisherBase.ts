import { IFormat, IItem, Item } from '../data';
import { HttpResponseFormat, HttpStreamFormat } from '../data';
import { PublisherClient } from './PublisherClient';
import { IGripConfigBase } from "./IGripConfigBase";
import { parseGripUriCustomParams } from "../utilities";

// The PublisherBase class allows consumers to easily publish HTTP response
// and HTTP stream format messages to GRIP proxies. PublisherBase can be configured
// using IGripConfig objects.
export abstract class PublisherBase<TConfig extends IGripConfigBase> {
    public clients: PublisherClient[] = [];

    constructor(config: string | TConfig | TConfig[] = []) {
        this.applyConfig(config);
    }

    // Apply the specified GRIP configuration to this PublisherBase instance.
    // The parameter can either be an object or an array of objects where
    // each object corresponds to a single PublisherClient instance. Each object
    // will be parsed and a PublisherClient will be created either using just
    // a URI or a URI and JWT authentication information.
    applyConfig(config: string | TConfig | TConfig[]) {
        const configsAsArray = Array.isArray(config) ? config : [config];
        for (const entry of configsAsArray) {
            const parsed = typeof entry === 'string' ? this.parseGripUri(entry) : entry;
            const client = this.buildPublisherClient(parsed);
            const { control_iss: iss, key } = parsed;
            if (iss != null) {
                client.setAuthJwt({ iss }, key ?? '');
            } else if (typeof key === 'string') {
                client.setAuthBearer(key);
            }

            this.addClient(client);
        }
    }

    parseGripUri(uri: string): TConfig {
        return parseGripUriCustomParams<TConfig>(uri);
    }

    abstract buildPublisherClient(config: TConfig): PublisherClient;

    // Add the specified PublisherClient instance.
    addClient(client: PublisherClient) {
        this.clients.push(client);
    }

    // The publish method for publishing the specified item to the specified
    // channel on the configured endpoint.
    // This function returns a promise which is resolved when the publish is complete,
    // or rejected with an exception describing the failure if the publish fails.
    async publish(channel: string, item: IItem) {
        await Promise.all(this.clients.map((client) => client.publish(channel, item)));
    }

    // A utility method for publishing an item to the specified channel on the configured endpoint
    // by building it from a single Format object or array of Format objects.
    // This function returns a promise which is resolved when the publish is complete,
    // or rejected with an exception describing the failure if the publish fails.
    async publishFormats(channel: string, formats: IFormat | IFormat[], id?: string, prevId?: string) {
        await this.publish(channel, new Item(formats, id, prevId));
    }

    // Publish an HTTP response format message to all of the configured
    // PubControlClients with a specified channel, message, and optional ID, and
    // previous ID.  The 'data' parameter may be provided as either an HttpResponseFormat
    // instance or a string (in which case an HttpResponseFormat instance will
    // be created and have the 'body' field set to the specified string).
    // This function returns a promise which is resolved when the publish is complete,
    // or rejected with an exception describing the failure if the publish fails.
    async publishHttpResponse(channel: string, data: HttpResponseFormat | string, id?: string, prevId?: string) {
        const httpResponse = data instanceof HttpResponseFormat ? data : new HttpResponseFormat({ body: data });

        return this.publishFormats(channel, httpResponse, id, prevId);
    }

    // Publish an HTTP stream format message to all of the configured
    // PubControlClients with a specified channel, message, and optional ID, and
    // previous ID.  The 'data' parameter may be provided as either an HttpStreamFormat
    // instance or a string (in which case an HttpStreamFormat instance will
    // be created and have the 'content' field set to the specified string).
    // This function returns a promise which is resolved when the publish is complete,
    // or rejected with an exception describing the failure if the publish fails.
    async publishHttpStream(channel: string, data: HttpStreamFormat | string, id?: string, prevId?: string) {
        const httpStream = data instanceof HttpStreamFormat ? data : new HttpStreamFormat(data);

        return this.publishFormats(channel, httpStream, id, prevId);
    }
}
