'use strict';

const dgram = require('dgram');
const serial = require('./deviceSerial');

let udpServer;
let ipaddress;
let devices = [];

let response = function() {
	let deviceresp = [];
	let responses = [];
	for(let i = 0; i <= devices.length - 1; i++) {
		let resp = new Buffer.from([
			'HTTP/1.1 200 OK',
			'CACHE-CONTROL: max-age=86400',
			'DATE: Mon, 22 Jun 2015 17:24:01 GMT',
			'EXT:',
			'LOCATION: http://' + ipaddress + ':' + devices[i].port + '/setup.xml',
			'OPT: "http://schemas.upnp.org/upnp/1/0/"; ns=01',
			'01-NLS: ' + serial(devices[i]) + '',
			'SERVER: Unspecified, UPnP/1.0, Unspecified',
			'X-User-Agent: redsonic',
			'ST: urn:Belkin:device:**',
			'USN: uuid:Socket-' + serial(devices[i]) + '::urn:Belkin:device:**'
		].join('\r\n') + '\r\n\r\n');
		responses.push(resp);
	}
	return responses;
}

let parseHeaders = function(message) {
	let lines = message.toString().split('\r\n');
	//console.log(lines);
	if(lines[0]=="M-SEARCH * HTTP/1.1") {
		let headers = {};
		for(let i = 1; i <= lines.length - 1; i++) {
			if(lines[i]=='') {
				//ignore
			} else {
				let header = lines[i].split(': ');
				headers[header[0]] = header[1];
			}
		}
		return headers;
	} else {
		return false;
	}
}

module.exports.startSSDPServer = function(fauxMo) {
	devices = fauxMo.devices;
	ipaddress = fauxMo.ipAddress;
	//console.log('here');
	udpServer = dgram.createSocket({type: 'udp4'});
	
	udpServer.on('error', (err) => {
		//debug(`server error:\n${err.stack}`);
		throw err;
	});
	
	udpServer.on('message', (msg, rinfo) => {
		//debug(`<< server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		//console.log('Search request from ' + rinfo);
		let search = parseHeaders(msg);
		if(search) {
			let resp = response();
			for(let i = 0; i <= resp.length - 1; i++) {
				//console.log(resp[i].toString());
				udpServer.send(resp[i], 0, resp[i].length, rinfo.port, rinfo.address);
				//console.log(resp[i].toString());
			}
		} else {
			//not a search, don't respond
		}
	});
	
	udpServer.on('listening', () => {
		try {
			const address = udpServer.address();
			//debug(`server listening ${address.address}:${address.port}`);
			udpServer.setMulticastTTL(128); 
			udpServer.addMembership('239.255.255.250', fauxMo.ipAddress);
		} catch (err) {
			//debug('udp server error: %s', err.message);
		}
	});
	
	//debug('binding to port 1900 for ssdp discovery');
	try {
		udpServer.bind(1900, function() {
			udpServer.setMulticastInterface(fauxMo.ipAddress);
		});
	} catch (err) {
		//debug('error binding udp server: %s', err.message);
	}
}