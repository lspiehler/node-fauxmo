'use strict';

const dgram = require('dgram');
const serial = require('./deviceSerial');
const util = require('util');
var ip = require('ip');
const os = require('os');

let udpServer;
let ipaddress;
let devices = [];

let response = function(ip) {
	let deviceresp = [];
	let responses = [];
	for(let i = 0; i <= devices.length - 1; i++) {
		let resp = new Buffer.from([
			'HTTP/1.1 200 OK',
			'CACHE-CONTROL: max-age=86400',
			'DATE: Mon, 22 Jun 2015 17:24:01 GMT',
			'EXT:',
			'LOCATION: http://' + ip + ':' + devices[i].port + '/setup.xml',
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

let findAddress = function(network) {
	let interfaces = os.networkInterfaces().Ethernet;
	for(let i = 0; i <= interfaces.length - 1; i++) {
		if(ip.cidr(interfaces[i].cidr)==network) {
			return interfaces[i].address;
		}
	}
}

module.exports.startSSDPServer = function(fauxMo) {
	devices = fauxMo.devices;
	if(fauxMo.hasOwnProperty('ipAddress')) {
		ipaddress = fauxMo.ipAddress;
	} else {
		ipaddress = '0.0.0.0';
	}
	//console.log('here');
	udpServer = dgram.createSocket({type: 'udp4'});
	
	udpServer.on('error', (err) => {
		//debug(`server error:\n${err.stack}`);
		throw err;
	});
	
	udpServer.on('message', (msg, rinfo) => {
		//debug(`<< server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		//console.log('Search request from ' + util.inspect(rinfo));
		//console.log(ip.cidr(rinfo.address + '/24'));
		let search = parseHeaders(msg);
		if(search) {
			let srcip;
			if(ipaddress == '0.0.0.0') {
				srcip = findAddress(ip.cidr(rinfo.address + '/24'));
			} else {
				srcip = ipaddress;
			}
			let resp = response(srcip);
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
			udpServer.addMembership('239.255.255.250', ipaddress);
		} catch (err) {
			//debug('udp server error: %s', err.message);
		}
	});
	
	//debug('binding to port 1900 for ssdp discovery');
	try {
		udpServer.bind(1900, function() {
			udpServer.setMulticastInterface(ipaddress);
		});
	} catch (err) {
		//debug('error binding udp server: %s', err.message);
	}
}