const EventEmitter = require('events');
const util = require('util');
const log = require("./log.js");
const Mqtt = require('mqtt');

function Bus(config, adapter) {
	log.info(adapter.type + 'bus construct');
	EventEmitter.call(this);
	var self = this;
	this.adapter = adapter;
	this.connected = false;
	this.config = config;
	this.prefix = this.config.prefix + "/" + this.adapter.type + "_" + this.adapter.id;
	this.mqtt = Mqtt.connect(this.config.url, {
		clientId: "hoco_" + self.adapter.type + "_" + self.adapter.id,
		username: self.config.username,
		password: self.config.password,
		will: {
			topic: self.prefix + "/@status",
			payload: JSON.stringify({
				val: "offline",
				data: {}
			}),
			qos: 0,
			retain: false
		}
	});
	
	this.mqtt.on('connect', function () {
		log.info(self.adapter.type + 'bus connect');
		self.connected = true;
// ToDo: subscribe to system wide topics like $time etc.
		self.mqtt.subscribe(self.prefix + "/#");
		send("@status", "online", {}, 0, false);
		self.emit("connected", self);
	});

	this.mqtt.on('reconnect', function() {
		log.info(self.adapter.type + 'bus reconnect');
		self.connected = false;
		self.emit("disconnected", self);
	});

	this.mqtt.on('close', function() {
		log.info(self.adapter.type + 'bus close');
		self.connected = false;
		self.emit("disconnected", self);
	});

	this.mqtt.on('offline', function() {
		log.info(self.adapter.type + 'bus offline');
		self.connected = false;
		self.emit("disconnected", self);
	});

	this.mqtt.on('error', function(err) {
		log.info(self.adapter.type + 'bus error: ' + JSON.stringify(err));
		self.connected = false;
		self.emit("error", self, err);
	});

// packetreceive
// packetsend
// outgoingEmpty

	this.mqtt.on('message', function (topic, message) {
//		log.info(self.adapter.type + "bus rx: " + topic + " = " + message);
// ToDo: handle system wide topics like $time etc.
		if (!topic.startsWith(self.prefix + "/"))
			return;
		var topicParts = topic.substring(self.prefix.length + 1).split('/');
		if (topicParts[0].startsWith("@")) {
			return;
		} else if (topicParts[0].startsWith("$")) {
			self.emit("adapter", self, topicParts[0].substring(1), message);
		} else {
			if (topicParts[1].startsWith("@")) {
				return;
			} else if (topicParts[1].startsWith("$")) {
				self.emit("node", self, topicParts[0], topicParts[1].substring(1), message);
			} else {
				if (topicParts[2].startsWith("@")) {
					return;
				} else if (topicParts[2].startsWith("$")) {
					self.emit("parameter", self, topicParts[0], topicParts[1], topicParts[2].substring(1), message);
				} else {
// ToDo:
				}
			}
		}
	});
};

util.inherits(Bus, EventEmitter)

function send(topic, value, data, qos = 0, retain = true) {
/*
	if (this.connected) {
		this.mqtt.publish(_prefix + "/" + topic, JSON.stringify({
			val: value,
			data: data
		}), { qos: qos, retain: retain });
	};
*/
};

Bus.prototype.connected = function() {
	return this.connected;
};

Bus.prototype.adapterSend = function(command, value, data, qos = 0, retain = true) {
	send("@" + command, value, data, qos, retain);
};
	
Bus.prototype.nodeSend = function(nodeid, command, value, data, qos = 0, retain = true) {
	send(nodeid + "/@" + command, value, data, qos, retain);
};
	
Bus.prototype.parameterSend = function(nodeid, parameterid, command, value, data, qos = 0, retain = true) {
	send(nodeid + "/" + parameterid + "/@" + command, value, data, qos, retain);
};

module.exports = Bus;

