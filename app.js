const config = require("./config.js");
const log = require("./log.js");
const Bus = require("./bus.js");
const stringify = require('json-stringify-safe');

var Adapter = {};
for (var i = 0; i < config.adapter.length; i++) {
	if (!Adapter[config.adapter[i].module]) {
		Adapter[config.adapter[i].module] = require(process.cwd() + "/" + config.adapter[i].module + ".js");
		log.debug("loading adapter module: " + config.adapter[i].module);
	}
}

for (var i = 0; i < config.adapter.length; i++) {
	var adapter = new Adapter[config.adapter[i].module](config.adapter[i]);
	adapter.type = config.adapter[i].type;

	adapter.on("connected", (theadapter, id) => {
                theadapter.id = id;

		var bus = new Bus(config.mqtt, theadapter);
		theadapter.bus = bus;

		bus.on("connected", (thebus) => {
		        log.debug("bus connected");
			if (thebus.adapter.connected)
                        	thebus.adapterSend("status", "online", {}, 0, false);
	        });

        	bus.on("adapter", (thebus, command, message) => {
                	log.debug("bus adapter command: " + command + ": " + JSON.stringify(message));
                	thebus.adapter.adapter(command, message);
        	});

        	bus.on("node", (thebus, nodeid, command, message) => {
                	log.debug("bus node command: " + command + " for " + nodeid + ": " + JSON.stringify(message));
                	thebus.adapter.node(nodeid, command, message);
        	});

	        bus.on("parameter", (thebus, nodeid, parameterid, command, message) => {
        	        log.debug("bus parameter command: " + command + " for " + nodeid + "/" + parameterid + ": " + JSON.stringify(message));
                	thebus.adapter.parameter(nodeid, parameterid, command, message);
        	});
	});

	adapter.on("adapter details", (theadapter, data) => {
		theadapter.bus.adapterSend("details", "", data);
	});

	adapter.on("node added", (theadapter, nodeid, data) => {
		theadapter.bus.nodeSend(nodeid, "status", "online", data);
	});

        adapter.on("node removed", (theadapter, nodeid, data) => {
                theadapter.bus.nodeSend(nodeid, "status", "offline", data);
        });

	adapter.on("node details", (theadapter, nodeid, data) => {
                theadapter.bus.nodeSend(nodeid, "details", "", data);
        });

        adapter.on("node parameters", (theadapter, nodeid, data) => {
                theadapter.bus.nodeSend(nodeid, "parameters", "", data);
        });

        adapter.on("parameter added", (theadapter, nodeid, parameterid, data) => {
                theadapter.bus.parameterSend(nodeid, parameterid, "status", "online", data);
        });

        adapter.on("parameter value", (theadapter, nodeid, parameterid, value, data) => {
                theadapter.bus.parameterSend(nodeid, parameterid, "", value, data);
        });

        adapter.on("parameter removed", (theadapter, nodeid, parameterid, data) => {
                theadapter.bus.parameterSend(nodeid, parameterid, "status", "offline", data);
        });

}
