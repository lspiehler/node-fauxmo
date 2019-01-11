const serial = require('./deviceSerial');

let fauxMo = {
	ipAddress: '192.168.1.198',
	devices: [{
		name: 'Multiple Fake Devices 1',
		port: 11000,
		handler: (action) => {
			console.log('office light action:', action);
		}
	},
	{
		name: 'Multiple Fake Devices 2',
		port: 11001,
		handler: (action) => {
			console.log('office fan action:', action);
		}
	},
	{
		name: 'Multiple Fake Devices 3',
		port: 11002,
		handler: (action) => {
			console.log('office fan action:', action);
		}
	},
	{
		name: 'Multiple Fake Devices 4',
		port: 11003,
		handler: (action) => {
			console.log('office fan action:', action);
		}
	}
	]
};


console.log(serial(fauxMo.devices[0]));
console.log(serial(fauxMo.devices[1]));
console.log(serial(fauxMo.devices[0]));
console.log(serial(fauxMo.devices[1]));
console.log(serial(fauxMo.devices[0]));
console.log(serial(fauxMo.devices[3]));
console.log(serial(fauxMo.devices[1]));