'use strict';

const dgram = require('dgram');
const serial = require('./deviceSerial');
const util = require('util');
const ip = require('ip');
const os = require('os');
var moment = require('moment');

let udpServer;
let ipaddress;
let devices = [];
let multicastintset = false;

let response = function(ipaddr) {
	let deviceresp = [];
	let responses = [];
	for(let i = 0; i <= devices.length - 1; i++) {
		let resp = new Buffer.from([
			'HTTP/1.1 200 OK',
			'CACHE-CONTROL: max-age=86400',
			'DATE: ' + moment.utc(new Date()).format("ddd, DD MMM YYYY HH:mm:ss") + ' GMT',
			'EXT:',
			'LOCATION: http://' + ipaddr + ':' + devices[i].port + '/setup.xml',
			'OPT: "http://schemas.upnp.org/upnp/1/0/"; ns=01',
			'01-NLS: ' + serial(devices[i]) + '',
			'SERVER: Unspecified, UPnP/1.0, Unspecified',
			'X-User-Agent: redsonic',
			'ST: urn:Belkin:service:basicevent:1',
			'USN: uuid:Socket-' + serial(devices[i]) + '::urn:Belkin:service:basicevent:1'
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
	let interfaces = os.networkInterfaces();
	let keys = Object.keys(interfaces);
	//console.log(util.inspect(keys));
	for(let i = 0; i <= keys.length - 1; i++) {
		//console.log(interfaces[keys[i]]);
		for(let j = 0; j <= interfaces[keys[i]].length - 1; j++) {
			//console.log(interfaces[keys[i]][j].address);
			if(getMask(interfaces[keys[i]][j].address, interfaces[keys[i]][j].netmask) == network) {
				return interfaces[keys[i]][j].address;
			}
		}
	}
}

var getMask = function(ipaddr, subnet) {
	let mask = ip.mask(ipaddr, subnet);
	return mask;
}

var findInterface = function(ipaddr) {
	let interfaces = os.networkInterfaces();
	let keys = Object.keys(interfaces);
	for(let i = 0; i <= keys.length - 1; i++) {
		for(let j = 0; j <= interfaces[keys[i]].length - 1; j++) {
			//console.log(interfaces[keys[i]][j]);
			if(interfaces[keys[i]][j].family=='IPv4'){
				if(ip.cidrSubnet(interfaces[keys[i]][j].cidr).contains(ipaddr)) {
					return interfaces[keys[i]][j].address;
				}
			}
		}
	}
	return false;
}

module.exports.startSSDPServer = function(fauxMo) {
	devices = fauxMo.devices;
	if(fauxMo.hasOwnProperty('ipAddress')) {
		ipaddress = fauxMo.ipAddress;
	} else {
		ipaddress = '0.0.0.0';
	}
	//console.log('here');
	udpServer = dgram.createSocket({type: 'udp4', reuseAddr: true});
	
	udpServer.on('error', (err) => {
		//debug(`server error:\n${err.stack}`);
		throw err;
	});
	
	udpServer.on('message', (msg, rinfo) => {
		//debug(`<< server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		//console.log('Search request from ' + util.inspect(rinfo));
		//console.log(getMask(rinfo.address, '255.255.255.0'));
		//console.log(getMask(rinfo.address, '255.255.255.0'));
		//console.log(findInterface(rinfo.address));
		let search = parseHeaders(msg);
		/*if(multicastintset===false) {
			let intip = findInterface(rinfo.address)
			if(intip) {
				multicastintset = true;
				udpServer.setMulticastInterface(intip);
			}
		}*/
		if(search) {
			let srcip;
			if(ipaddress == '0.0.0.0') {
				srcip = findAddress(getMask(rinfo.address, '255.255.255.0'));
				//console.log('Search request from ' + util.inspect(rinfo));
				//console.log(search);
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
			//const address = udpServer.address();
			//debug(`server listening ${address.address}:${address.port}`);
			udpServer.setMulticastTTL(128); 
			//console.log(ipaddress);
			if(ipaddress=='0.0.0.0') {
				let interfaces = os.networkInterfaces();
				let keys = Object.keys(interfaces);
				for(let i = 0; i <= keys.length - 1; i++) {
					for(let j = 0; j <= interfaces[keys[i]].length - 1; j++) {
						//console.log(interfaces[keys[i]][j]);
						if(interfaces[keys[i]][j].family=='IPv4'){
							udpServer.addMembership('239.255.255.250', interfaces[keys[i]][j].address);
						}
					}
				}
			} else {
				udpServer.addMembership('239.255.255.250', ipaddress);
			}
		} catch (err) {
			//debug('udp server error: %s', err.message);
		}
	});
	
	//debug('binding to port 1900 for ssdp discovery');
	//try {
		udpServer.bind(1900, ipaddress, function(err) {
			if(err) {
				console.trace(err);
			} else {
				const address = udpServer.address();
				console.log(`server listening ${address.address}:${address.port}`);
			}
			if(ipaddress!='0.0.0.0') {
				udpServer.setMulticastInterface(ipaddress);
			}
			/*if(ipaddress=='0.0.0.0') {
				let interfaces = os.networkInterfaces();
                                let keys = Object.keys(interfaces);
                                for(let i = 0; i <= keys.length - 1; i++) {
                                        for(let j = 0; j <= interfaces[keys[i]].length - 1; j++) {
						if(interfaces[keys[i]][j].family=='IPv4'){
							console.log('Adding multicast membership for ' + interfaces[keys[i]][j].address);
                                                	udpServer.setMulticastInterface(interfaces[keys[i]][j].address);
						}
                                                //udpServer.setMulticastInterface(keys[i]);
                                        }
			}
				//udpServer.setMulticastInterface(ipaddress);
			} else {
				udpServer.setMulticastInterface('192.168.1.51');
			}*/
		});
	//} catch (err) {
		//debug('error binding udp server: %s', err.message);
	//}
}
