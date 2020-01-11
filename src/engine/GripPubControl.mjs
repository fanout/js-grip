import PubControl, { Item } from '@fanoutio/pubcontrol';
import HttpStreamFormat from '../data/http/HttpStreamFormat.mjs';
import HttpResponseFormat from '../data/http/HttpResponseFormat.mjs';
import { isFunction } from "../utilities.mjs";

// The GripPubControl class allows consumers to easily publish HTTP response
// and HTTP stream format messages to GRIP proxies. Configuring GripPubControl
// is slightly different from configuring PubControl in that the 'uri' and
// 'iss' keys in each config entry should have a 'control_' prefix.
// GripPubControl inherits from PubControl and therefore also provides all
// of the same functionality.
export default class GripPubControl extends PubControl {
    constructor(config = []) {
        super();
        this.applyGripConfig(config);
    }
    // Apply the specified GRIP configuration to this GripPubControl instance.
    // The configuration object can either be a hash or an array of hashes where
    // each hash corresponds to a single PubControlClient instance. Each hash
    // will be parsed and a PubControlClient will be created either using just
    // a URI or a URI and JWT authentication information.
    applyGripConfig(config) {
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
    publishHttpResponse(channel, httpResponse, id, prevId, cb) {
        return this._publish(
            channel,
            httpResponse,
            HttpResponseFormat,
            data => new HttpResponseFormat({body: data}),
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
    publishHttpStream(channel, httpStream, id, prevId, cb) {
        return this._publish(
            channel,
            httpStream,
            HttpStreamFormat,
            data => new HttpStreamFormat(data),
            id,
            prevId,
            cb
        );
    }

    _publish(channel, data, type, factory, id, prevId, cb) {

        if (isFunction(id)) {
            cb = id;
            id = undefined;
            prevId = undefined;
        }

        const format = data instanceof type ? data : factory(data);

        const item = new Item(format, id, prevId);
        return this.publish(channel, item, cb);
    }
}
