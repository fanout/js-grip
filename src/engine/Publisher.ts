import Item from '../data/Item';
import IFormat from '../data/IFormat';
import IPublishCallback from './IPublishCallback';
import HttpStreamFormat from '../data/http/HttpStreamFormat';
import HttpResponseFormat from '../data/http/HttpResponseFormat';
import IGripConfig from "./IGripConfig";
import IPublisherConfig from "./IPublisherConfig";
import { gripConfigToPublisherConfig, isGripConfig } from "./configUtilities";
import PublisherClient from "./PublisherClient";
import IItem from "../data/IItem";
import PublishException from "../data/PublishException";

// The Publisher class allows consumers to easily publish HTTP response
// and HTTP stream format messages to GRIP proxies. Publisher can be configured
// using either IGripConfig or IPublisherConfig objects, meaning that they can
// provide either a pair of control_uri and control_iss, or a pair of uri and iss.
export default class Publisher {
    public clients: PublisherClient[] = [];

    constructor(config: IGripConfig | IPublisherConfig | (IGripConfig | IPublisherConfig)[] = []) {
        this.applyConfig(config);
    }

    // Apply the specified GRIP configuration to this Publisher instance.
    // The parameter can either be an object or an array of objects where
    // each object corresponds to a single PublisherClient instance. Each object
    // will be parsed and a PublisherClient will be created either using just
    // a URI or a URI and JWT authentication information.
    applyConfig(config: IGripConfig | IPublisherConfig | (IGripConfig | IPublisherConfig)[]) {

        const configsAsArray = Array.isArray(config) ? config : [ config ];
        for (const entry of configsAsArray) {
            const publisherConfig = isGripConfig(entry) ? gripConfigToPublisherConfig(entry) : entry;

            const { uri, iss, key } = publisherConfig;
            const client = new PublisherClient(uri);
            if (iss != null) {
                client.setAuthJwt({ iss }, key);
            }

            this.addClient(client);
        }

    }

    // Remove all of the configured PublisherClient instances.
    removeAllClients() {
        this.clients = [];
    }

    // Add the specified PublisherClient instance.
    addClient(client: PublisherClient) {
        this.clients.push(client);
    }

    // The publish method for publishing the specified item to the specified
    // channel on the configured endpoint. The callback method is optional
    // and will be passed the publishing results after publishing is complete.
    // Note that a failure to publish in any of the configured PublisherClient
    // instances will result in a failure result being passed to the callback
    // method along with the first encountered error message.
    // If no callback method is passed, then this function returns a promise which
    // is resolved when the publish is complete, or the promise being rejected with
    // an exception describing the failure if the publish fails.
    publish(channel: string, item: IItem, cb?: IPublishCallback): Promise<void> {
        const publishResults = Promise.all(
            this.clients.map(client => client.publish(channel, item))
        );

        if (cb == null) {
            return Promise.resolve(publishResults as unknown as Promise<void>);
        }

        (async() => {
            let success;
            let message;
            let context;
            try {
                await publishResults;
                success = true;
            } catch(ex) {
                if (ex instanceof PublishException) {
                    success = false;
                    message = ex.message;
                    context = ex.context;
                } else {
                    throw ex;
                }
            }
            if (success) {
                cb(true);
            } else {
                cb(false, message, context);
            }
        })();

        return Promise.resolve();
    }

    // Publish an HTTP response format message to all of the configured
    // PubControlClients with a specified channel, message, and optional ID,
    // previous ID, and callback. Note that the 'http_response' parameter can
    // be provided as either an HttpResponseFormat instance or a string (in
    // which case an HttpResponseFormat instance will automatically
    // be created and have the 'body' field set to the specified string). When
    // specified, the callback method will be called after publishing is complete
    // and passed a result and error message (if an error was encountered). The
    // callback method can be specified as the third parameter if the ID and
    // previous ID parameters are omitted.
    publishHttpResponse(channel: string, data: HttpResponseFormat | string, cb?: IPublishCallback): Promise<void>;
    publishHttpResponse(channel: string, data: HttpResponseFormat | string, id: string | IPublishCallback, prevId: string, cb?: IPublishCallback): Promise<void>;
    publishHttpResponse(channel: string, data: HttpResponseFormat | string, ...args: any[]): Promise<void> {

        let id: string | undefined;
        let prevId: string | undefined;
        let cb: IPublishCallback | undefined;

        if (args[0] as IPublishCallback) {
            [cb] = args;
        } else {
            [id, prevId, cb] = args;
        }

        const httpResponse = data instanceof HttpResponseFormat ? data : new HttpResponseFormat({body: data});

        return this._publish(
            channel,
            httpResponse,
            id,
            prevId,
            cb
        );
    }

    // Publish an HTTP stream format message to all of the configured
    // PubControlClients with a specified channel, message, and optional ID,
    // previous ID, and callback. Note that the 'http_stream' parameter can
    // be provided as either an HttpStreamFormat instance or a string (in
    // which case an HttpStreamFormat instance will automatically
    // be created and have the 'content' field set to the specified string). When
    // specified, the callback method will be called after publishing is complete
    // and passed a result and error message (if an error was encountered). The
    // callback method can be specified as the third parameter if the ID and
    // previous ID parameters are omitted.
    publishHttpStream(channel: string, data: HttpStreamFormat | string, cb?: IPublishCallback): Promise<void>;
    publishHttpStream(channel: string, data: HttpStreamFormat | string, id: string, prevId: string, cb?: IPublishCallback): Promise<void>;
    publishHttpStream(channel: string, data: HttpStreamFormat | string, ...args: any[]): Promise<void> {

        let id: string | undefined;
        let prevId: string | undefined;
        let cb: IPublishCallback | undefined;

        if (args[0] as IPublishCallback) {
            [cb] = args;
        } else {
            [id, prevId, cb] = args;
        }

        const httpStream = data instanceof HttpStreamFormat ? data : new HttpStreamFormat(data);

        return this._publish(
            channel,
            httpStream,
            id,
            prevId,
            cb
        );
    }

    _publish(channel: string, format: IFormat, id?: string, prevId?: string, cb?: IPublishCallback): Promise<void> {
        const item = new Item(format, id, prevId);
        return this.publish(channel, item, cb);
    }
}
