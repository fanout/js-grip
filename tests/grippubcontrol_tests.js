var assert = require('assert');
var util = require('util');
var pubcontrol = require('pubcontrol');
var httpresponseformat = require('../lib/httpresponseformat')
var httpstreamformat = require('../lib/httpstreamformat')
var grippubcontrol = require('../lib/grippubcontrol');

var TestFormat = function(body) { this.body = body; };
util.inherits(TestFormat, pubcontrol.Format);
TestFormat.prototype.name = function() { return 'testformat'; };
TestFormat.prototype.export = function() { return {'body': this.body}; };
var TestItem = new pubcontrol.Item();

(function testInitialize() {
    var pc = new grippubcontrol.GripPubControl();
    assert.equal(pc.pubControl.clients.length, 0);
    var pc = new grippubcontrol.GripPubControl({ 'control_uri': 'uri',
            'control_iss': 'iss',
            'key': 'key==' });
    assert.equal(pc.pubControl.clients.length, 1);
})();

(function testApplyGripConfig() {
    var pc = new grippubcontrol.GripPubControl();
    pc.applyGripConfig({ 'control_uri': 'uri',
            'control_iss': 'iss',
            'key': 'key==' });
    assert.equal(pc.pubControl.clients.length, 1);
    assert.equal(pc.pubControl.clients[0].uri, 'uri');
    assert.equal(pc.pubControl.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.pubControl.clients[0].auth.key, 'key==');
    pc.applyGripConfig([{ 'control_uri': 'uri2',
            'control_iss': 'iss2',
            'key': 'key==2' },
          { 'control_uri': 'uri3',
            'control_iss': 'iss3',
            'key': 'key==3'}]);
    assert.equal(pc.pubControl.clients.length, 3);
    assert.equal(pc.pubControl.clients[0].uri, 'uri');
    assert.equal(pc.pubControl.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.pubControl.clients[0].auth.key, 'key==');
    assert.equal(pc.pubControl.clients[1].uri, 'uri2');
    assert.equal(pc.pubControl.clients[1].auth.claim['iss'], 'iss2');
    assert.equal(pc.pubControl.clients[1].auth.key, 'key==2');
    assert.equal(pc.pubControl.clients[2].uri, 'uri3');
    assert.equal(pc.pubControl.clients[2].auth.claim['iss'], 'iss3');
    assert.equal(pc.pubControl.clients[2].auth.key, 'key==3');
})();

(function testRemoveAllClients() {
    var pc = new grippubcontrol.GripPubControl({ 'control_uri': 'uri',
            'control_iss': 'iss',
            'key': 'key==' });
    assert.equal(pc.pubControl.clients.length, 1);
    pc.removeAllClients();
    assert.equal(pc.pubControl.clients.length, 0);
})();

(function testAddClient() {
    var pc = new grippubcontrol.GripPubControl({ 'control_uri': 'uri',
            'control_iss': 'iss',
            'key': 'key==' });
    assert.equal(pc.pubControl.clients.length, 1);
    pc.addClient(new pubcontrol.PubControlClient('uri'));
    assert.equal(pc.pubControl.clients.length, 2);
})();

(function testApplyConfig() {
    var pc = new grippubcontrol.GripPubControl();
    pc.applyConfig({ 'uri': 'uri',
            'iss': 'iss',
            'key': 'key==' });
    assert.equal(pc.pubControl.clients.length, 1);
    assert.equal(pc.pubControl.clients[0].uri, 'uri');
    assert.equal(pc.pubControl.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.pubControl.clients[0].auth.key, 'key==');
    pc.applyConfig([{ 'uri': 'uri2',
            'iss': 'iss2',
            'key': 'key==2' },
          { 'uri': 'uri3',
            'iss': 'iss3',
            'key': 'key==3'}]);
    assert.equal(pc.pubControl.clients.length, 3);
    assert.equal(pc.pubControl.clients[0].uri, 'uri');
    assert.equal(pc.pubControl.clients[0].auth.claim['iss'], 'iss');
    assert.equal(pc.pubControl.clients[0].auth.key, 'key==');
    assert.equal(pc.pubControl.clients[1].uri, 'uri2');
    assert.equal(pc.pubControl.clients[1].auth.claim['iss'], 'iss2');
    assert.equal(pc.pubControl.clients[1].auth.key, 'key==2');
    assert.equal(pc.pubControl.clients[2].uri, 'uri3');
    assert.equal(pc.pubControl.clients[2].auth.claim['iss'], 'iss3');
    assert.equal(pc.pubControl.clients[2].auth.key, 'key==3');
})();

(function testPublish() {
    var wasPublishCalled = false;
    var pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, callback) {
        assert.equal(item, 'item');
        assert.equal(channel, 'chan');
        assert.equal(callback, null);   
        wasPublishCalled = true;
    }});
    pc.publish('chan', 'item');
    assert(wasPublishCalled);
})();

(function testPublishCallback() {
    var callback = function() {};
    var wasPublishCalled = false;
    var pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, cb) {
        assert.equal(item, 'item');
        assert.equal(channel, 'chan');
        assert.equal(cb.numCalls, 2);   
        assert.equal(cb.callback, callback);   
        wasPublishCalled = true;
    }});
    pc.addClient({ publish: function(channel, item, cb) {
        assert.equal(item, 'item');
        assert.equal(channel, 'chan');
        assert.equal(cb.numCalls, 2);   
        assert.equal(cb.callback, callback); 
        wasPublishCalled = true;
    }});
    pc.publish('chan', 'item', callback);
    assert(wasPublishCalled);
})();

(function testPublishHttpResponse() {
    var wasPublishCalled = false;
    var pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, callback) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpresponseformat.HttpResponseFormat(
                    {body: 'message'}))));
        assert.equal(channel, 'chan');
        assert.equal(callback, null);   
        wasPublishCalled = true;
    }});
    pc.publishHttpResponse('chan', 'message');
    assert(wasPublishCalled);
    wasPublishCalled = false;
    pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, callback) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpresponseformat.HttpResponseFormat('1', '2', '3',
                    '4'))));
        assert.equal(channel, 'chan');
        assert.equal(callback, null);   
        wasPublishCalled = true;
    }});
    pc.publishHttpResponse('chan', new httpresponseformat.HttpResponseFormat(
            '1', '2', '3', '4'));
    assert(wasPublishCalled);
})();

(function testResponsePublishCallback() {
    var callback = function() {};
    var wasPublishCalled = false;
    var pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, cb) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpresponseformat.HttpResponseFormat(
                    {body: 'message'}))));
        assert.equal(channel, 'chan');
        assert.equal(cb.numCalls, 2);   
        assert.equal(cb.callback, callback);   
        wasPublishCalled = true;
    }});
    pc.addClient({ publish: function(channel, item, cb) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpresponseformat.HttpResponseFormat(
                    {body: 'message'}))));
        assert.equal(channel, 'chan');
        assert.equal(cb.numCalls, 2);   
        assert.equal(cb.callback, callback); 
        wasPublishCalled = true;
    }});
    pc.publishHttpResponse('chan', 'message', callback);
    assert(wasPublishCalled);
})();

(function testPublishHttpStream() {
    var wasPublishCalled = false;
    var pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, callback) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpstreamformat.HttpStreamFormat('message'))));
        assert.equal(channel, 'chan');
        assert.equal(callback, null);   
        wasPublishCalled = true;
    }});
    pc.publishHttpStream('chan', 'message');
    assert(wasPublishCalled);
    wasPublishCalled = false;
    pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, callback) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpstreamformat.HttpStreamFormat('1'))));
        assert.equal(channel, 'chan');
        assert.equal(callback, null);   
        wasPublishCalled = true;
    }});
    pc.publishHttpStream('chan', new httpstreamformat.HttpStreamFormat(
            '1'));
    assert(wasPublishCalled);
})();

(function testStreamPublishCallback() {
    var callback = function() {};
    var wasPublishCalled = false;
    var pc = new grippubcontrol.GripPubControl();
    pc.addClient({ publish: function(channel, item, cb) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpstreamformat.HttpStreamFormat(
                    'message'))));
        assert.equal(channel, 'chan');
        assert.equal(cb.numCalls, 2);   
        assert.equal(cb.callback, callback);   
        wasPublishCalled = true;
    }});
    pc.addClient({ publish: function(channel, item, cb) {
        assert.equal(JSON.stringify(item), JSON.stringify(new pubcontrol.Item(
                    new httpstreamformat.HttpStreamFormat(
                    'message'))));
        assert.equal(channel, 'chan');
        assert.equal(cb.numCalls, 2);   
        assert.equal(cb.callback, callback); 
        wasPublishCalled = true;
    }});
    pc.publishHttpStream('chan', 'message', callback);
    assert(wasPublishCalled);
})();
