import PubControlClient from "./PubControlClient";
import PublishException from "../data/PublishException";

import IItem from "../data/IItem";
import IPubControlConfig from "./IPubControlConfig";
import IPubControlPublishCallback from "./IPubControlPublishCallback";

// The PubControl class allows a consumer to manage a set of publishing
// endpoints and to publish to all of those endpoints via a single publish
// method call. A PubControl instance can be configured either using a
// hash or array of hashes containing configuration information or by
// manually adding PubControlClient instances.
export default class PubControl {
    public clients: PubControlClient[] = [];

    constructor(config?: IPubControlConfig | IPubControlConfig[]) {
        // Initialize with or without a configuration. A configuration can be applied
        // after initialization via the apply_config method.
        this.applyConfig(config);
    }
    // Remove all of the configured PubControlClient instances.
    removeAllClients() {
        this.clients = [];
    }
    // Add the specified PubControlClient instance.
    addClient(client: PubControlClient) {
        this.clients.push(client);
    }
    // Apply the specified configuration to this PubControl instance. The
    // configuration object can either be a hash or an array of hashes where
    // each hash corresponds to a single PubControlClient instance. Each hash
    // will be parsed and a PubControlClient will be created either using just
    // a URI or a URI and JWT authentication information.
    applyConfig(config: IPubControlConfig | IPubControlConfig[] = []) {

        const configsArray = Array.isArray(config) ? config : [config];

        for (const entry of configsArray) {
            const { uri, iss, key } = entry;
            const client = new PubControlClient(uri);
            if (iss != null) {
                client.setAuthJwt({ iss }, key);
            }
            this.addClient(client);
        }

    }

    // The publish method for publishing the specified item to the specified
    // channel on the configured endpoint. The callback method is optional
    // and will be passed the publishing results after publishing is complete.
    // Note that a failure to publish in any of the configured PubControlClient
    // instances will result in a failure result being passed to the callback
    // method along with the first encountered error message.
    // If no callback method is passed, then this function returns a promise which
    // is resolved when the publish is complete, or the promise being rejected with
    // an exception describing the failure if the publish fails.
    publish(channel: string, item: IItem, cb?: IPubControlPublishCallback): Promise<void> {
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
}
