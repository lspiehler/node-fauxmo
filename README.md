# node-fauxmo
Make fake WeMo devices. Another Node.JS port of fauxmo, borrowing heavily from fauxmojs

# Installation
npm install node-fauxmo

# Usage
This example demonstrates the creation of 4 fake devices. The fourth uses the optional "statusHandler" method allowing the fake device to query other sources for it's status.
```
'use strict';

const FauxMo = require('node-fauxmo');

var dev4status = 0;

var dev4statushandler = function() {
	return dev4status;
}

var dev4handler = function(action) {
	dev4status = action;
}

let fauxMo = new FauxMo(
{
	ipAddress: '192.168.1.198',
	devices: [{
		name: 'Fake Device 1',
		port: 11000,
		handler: function(action) {
			console.log('Fake Device 1:', action);
		}
	},
	{
		name: 'Fake Device 2',
		port: 11001,
		handler: function(action) {
			console.log('Fake Device 2:', action);
		}
	},
	{
		name: 'Fake Device 3',
		port: 11002,
		handler: function(action) {
			console.log('Fake Device 3:', action);
		}
	},
	{
		name: 'Fake Device 4',
		port: 11003,
		handler: function(action) {
			console.log('Fake Device 4:', action);
			dev4handler(action);
		},
		statusHandler: function(callback) {
			callback(dev4statushandler());
		}
	}
	]
});
```