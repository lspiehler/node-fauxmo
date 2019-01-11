'use strict';

const FauxMo = require('../src/index');

var dev4status = 0;

var dev4statushandler = function() {
	//console.log('I am getting status here');
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