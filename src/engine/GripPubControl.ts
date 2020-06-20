import PubControl from './PubControl';
import Item from '../data/Item';
import IFormat from '../data/IFormat';
import IPubControlPublishCallback from './IPubControlPublishCallback';
import HttpStreamFormat from '../data/http/HttpStreamFormat';
import HttpResponseFormat from '../data/http/HttpResponseFormat';
import IGripConfig from "./IGripConfig";

// The GripPubControl class allows consumers to easily publish HTTP response
// and HTTP stream format messages to GRIP proxies. Configuring GripPubControl
// is slightly different from configuring PubControl in that the 'uri' and
// 'iss' keys in each config entry should have a 'control_' prefix.
// GripPubControl inherits from PubControl and therefore also provides all
// of the same functionality.
export default class GripPubControl extends PubControl {
    constructor(config: IGripConfig | IGripConfig[] = []) {
        super();
        this.applyGripConfig(config);
    }
    // Apply the specified GRIP configuration to this GripPubControl instance.
    // The configuration object can either be a hash or an array of hashes where
    // each hash corresponds to a single PubControlClient instance. Each hash
    // will be parsed and a PubControlClient will be created either using just
    // a URI or a URI and JWT authentication information.
    applyGripConfig(config: IGripConfig | IGripConfig[]) {
        const configsArray = Array.isArray(config) ? config : [config];
        const configsTransformed = configsArray.map(entry => {
            const { control_uri: uri, control_iss: iss, key, } = entry;
            return {
                uri, iss, key,
            };
        });
        this.applyConfig(configsTransformed);
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
    publishHttpResponse(channel: string, data: HttpResponseFormat | string, cb?: IPubControlPublishCallback): Promise<void>;
    publishHttpResponse(channel: string, data: HttpResponseFormat | string, id: string | IPubControlPublishCallback, prevId: string, cb?: IPubControlPublishCallback): Promise<void>;
    publishHttpResponse(channel: string, data: HttpResponseFormat | string, ...args: any[]): Promise<void> {

        let id: string | undefined;
        let prevId: string | undefined;
        let cb: IPubControlPublishCallback | undefined;

        if (args[0] as IPubControlPublishCallback) {
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
    publishHttpStream(channel: string, data: HttpStreamFormat | string, cb?: IPubControlPublishCallback): Promise<void>;
    publishHttpStream(channel: string, data: HttpStreamFormat | string, id: string, prevId: string, cb?: IPubControlPublishCallback): Promise<void>;
    publishHttpStream(channel: string, data: HttpStreamFormat | string, ...args: any[]): Promise<void> {

        let id: string | undefined;
        let prevId: string | undefined;
        let cb: IPubControlPublishCallback | undefined;

        if (args[0] as IPubControlPublishCallback) {
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

    _publish(channel: string, format: IFormat, id?: string, prevId?: string, cb?: IPubControlPublishCallback): Promise<void> {
        const item = new Item(format, id, prevId);
        return this.publish(channel, item, cb);
    }
}
