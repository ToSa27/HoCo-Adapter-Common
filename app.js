const config = require("./config.js");
const log = require("./log.js");
const Bus = require("./bus.js");

var Adapter = {};
for (var i = 0; i < config.adapter.length; i++) {
	if (!Adapter[config.adapter[i].module]) {
		Adapter[config.adapter[i].module] = require(process.cwd() + "/" + config.adapter[i].module + ".js");
		log.info("loading adapter module: " + config.adapter[i].module);
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
		        log.info("bus connected");
			if (thebus.adapter.connected)
                        	thebus.adapterSend("status", "online", {}, 0, false);
	        });

        	bus.on("adapter", (thebus, command, message) => {
                	log.info("bus adapter command: " + command + ": " + message);
                	thebus.adapter.adapter(command, message);
        	});

        	bus.on("node", (thebus, nodeid, command, message) => {
                	log.info("bus node command: " + command + " for " + nodeid + ": " + message);
                	thebus.adapter.node(nodeid, command, message);
        	});

	        bus.on("parameter", (thebus, nodeid, parameterid, command, message) => {
        	        log.info("bus parameter command: " + command + " for " + nodeid + "/" + parapeterid + ": " + message);
                	thebus.adapter.parameter(nodeid, parameterid, command, message);
        	});
	});
}
