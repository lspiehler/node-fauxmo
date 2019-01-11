'use strict';

const http = require('http');
const serial = require('./deviceSerial');

let devices = [];

var getState = function(index, callback) {
	if(devices[index].hasOwnProperty('statusHandler')) {
		devices[index].statusHandler(function(status) {
			//console.log(status);
			callback(status);
		});
	} else {
		callback(devices[index].state);
	}
}

var setState = function(index, state) {
	devices[index].state = state;
	devices[index].handler(state);
}

module.exports.startWebServer = function(fauxMo) {
	devices = fauxMo.devices;
	
	let services = [];
	
	for(let i = 0; i <= devices.length - 1; i++) {
		const port = devices[i].port;
		devices[i].state = 0;

		const server = http.createServer(function(request, response) {
			//console.log(request.url + ':' + port + ' from ' + request.connection.remoteAddress);
			if (request.method == 'POST') {
				let body = '';
				request.on('data', (chunk) => {
					//consider adding size limit here
					body += chunk.toString()
				})

				request.on('end', () => {
					let soapaction = request.headers.soapaction.split('#')[1];
					let action = soapaction.substring(0, soapaction.length - 1);
					//console.log(action);
					//console.log(body)
					let xmlresponse;
					getState(i, function(state) {
						if(action=="GetBinaryState") {
							//console.log(request.headers);
							xmlresponse = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
								<s:Body>
									<u:GetBinaryStateResponse xmlns:u="urn:Belkin:service:basicevent:1">
										<BinaryState>` + state + `</BinaryState>
									</u:GetBinaryStateResponse>
									</s:Body>
								</s:Envelope>`
						} else if(action=="SetBinaryState") {
							//console.log('Current state is ' + getState(i));
							if(state==0) {
								setState(i, 1);
							} else {
								setState(i, 0);
							}
							xmlresponse = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
								<s:Body>
									<u:SetBinaryStateResponse xmlns:u="urn:Belkin:service:basicevent:1">
									<CountdownEndTime>0</CountdownEndTime>
									</u:SetBinaryStateResponse>
								</s:Body>
							</s:Envelope>`
						} else {
							
						}
						//console.log(xmlresponse);
						response.setHeader('Content-Type', 'text/xml');
						response.end(xmlresponse)
					});
				});
			} else if(request.method == 'GET') {
				if(request.url=='/setup.xml') {
					response.setHeader('Content-Type', 'text/xml');
					let xml = `<?xml version="1.0"?>
						<root>
						  <device>
							<deviceType>urn:MakerMusings:device:controllee:1</deviceType>
							<friendlyName>` + devices[i].name + `</friendlyName>
							<manufacturer>Belkin International Inc.</manufacturer>
							<modelName>Emulated Socket</modelName>
							<modelNumber>3.1415</modelNumber>
							<UDN>uuid:Socket-1_0-` + serial(devices[i]) + `</UDN>
						  </device>
						</root>`
					//console.log(xml);
					response.end(xml);
				} else {
					console.log('Unhandled http ' + request.method + ' request ' + request.url);
					response.end('Hello Node.js Server!');
				}
			} else {
				console.log('Unhandled http ' + request.method + ' request ' + request.url);
				response.end('Hello Node.js Server!');
			}
		});
		
		server.listen(port, (err) => {
			if (err) {
				return console.log('something bad happened', err);
			}

			console.log(`server is listening on ${port}`);
		});
	}
}