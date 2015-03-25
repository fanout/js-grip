/*
 * node-grip
 * GRIP library for NodeJS.
 * (C) 2015 Fanout, Inc.
 * File name: grippubcontrol.js
 * File contains: the GripPubControl class.
 * File authors: 
 * Katsuyuki Ohmuro <harmony7@pex2.jp>
 * Konstantin Bokarius <kon@fanout.io>
 * Licensed under the MIT License, see file COPYING for details.
 */

var pubcontrol = require('pubcontrol');
var httpstreamformat = require('./httpstreamformat');
var httpresponseformat = require('./httpresponseformat');
var utilities = require('./utilities');

// The GripPubControl class allows consumers to easily publish HTTP response
// and HTTP stream format messages to GRIP proxies. Configuring GripPubControl
// is slightly different from configuring PubControl in that the 'uri' and
// 'iss' keys in each config entry should have a 'control_' prefix.
// GripPubControl inherits from PubControl and therefore also provides all
// of the same functionality.
var GripPubControl = utilities.defineClass(function(config) {

    // Initialize with or without a configuration. A configuration can be applied
    // after initialization via the apply_grip_config method.
    if (arguments.length == 1) {
        this.applyGripConfig(config);
    }
    else {
        this.pubControl = new pubcontrol.PubControl();
    }
}, {

    // Apply the specified GRIP configuration to this GripPubControl instance.
    // The configuration object can either be a hash or an array of hashes where
    // each hash corresponds to a single PubControlClient instance. Each hash
    // will be parsed and a PubControlClient will be created either using just
    // a URI or a URI and JWT authentication information.
    applyGripConfig: function (config) {
        var pubControl = null;
        if (typeof this.pubControl !== 'undefined') {
            pubControl = this.pubControl;
        }
        else {
            pubControl = new pubcontrol.PubControl();
        } 
        var config = utilities.isArray(config) ? config : [config];
        config.forEach(function(entry) {
            if (!('control_uri' in entry)) {
                return;
            }
            var client = new pubcontrol.PubControlClient(entry['control_uri']);
            if ('control_iss' in entry) {
                client.setAuthJwt({'iss': entry['control_iss']}, entry['key']);
            }
            pubControl.addClient(client);
        });
        this.pubControl = pubControl;
    },

    // Remove all PubControlClient instances. This acts as a passthrough method
    // to the PubControl client instance.
    removeAllClients: function () {
        this.pubControl.removeAllClients();
    },

    // Add the specified PubControlClient instance. This acts as a passthrough
    // method to the PubControl client instance.
    addClient: function (client) {
        this.pubControl.addClient(client);
    },

    // Publish the specified item to the specified channel with an
    // optional callback on all configured PubControlClient instances.
    // This acts as a passthrough method to the PubControl client instance.
    publish: function (channel, item, cb) {
        this.pubControl.publish(channel, item, cb);
    },

    // Apply the specified regular PubControl config. This acts as a passthrough
    // method to the PubControl client instance.
    applyConfig: function (config) {
        this.pubControl.applyConfig(config);
    },

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
    publishHttpResponse: function (channel, httpResponse, id, prevId, cb) {
        if (utilities.isFunction(id)) {
            cb = id;
            id = undefined;
            prevId = undefined;
        }
        if (!(httpResponse instanceof httpresponseformat.HttpResponseFormat)) {
            httpResponse = new httpresponseformat.
                    HttpResponseFormat({body: httpResponse});
        }
        var item = new pubcontrol.Item(httpResponse, id, prevId);
        this.pubControl.publish(channel, item, cb);
    },

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
    publishHttpStream: function (channel, httpStream, id, prevId, cb) {
        if (utilities.isFunction(id)) {
            cb = id;
            id = undefined;
            prevId = undefined;
        }
        if (!(httpStream instanceof httpstreamformat.HttpStreamFormat)) {
            httpStream = new httpstreamformat.HttpStreamFormat(httpStream);
        }
        var item = new pubcontrol.Item(httpStream, id, prevId);
        this.pubControl.publish(channel, item, cb);
    }
});

exports.GripPubControl = GripPubControl;
