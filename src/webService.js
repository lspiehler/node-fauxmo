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
							//console.log('Current state is ' + body);
							let searchstr = body.indexOf('</BinaryState>');
							let statereq = body.substring(searchstr - 1, searchstr);
							setState(i, parseInt(statereq));
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
							<deviceType>urn:Belkin:device:controllee:1</deviceType>
							<friendlyName>` + devices[i].name + `</friendlyName>
							<manufacturer>Belkin International Inc.</manufacturer>
							<manufacturerURL>http://www.belkin.com</manufacturerURL>
							<modelDescription>Belkin Plugin Socket 1.0</modelDescription>
							<modelName>Socket</modelName>
							<modelNumber>1.0</modelNumber>
							<serialNumber>` + serial(devices[i]) + `</serialNumber>
							<UDN>uuid:Socket-1_0-` + serial(devices[i]) + `</UDN>
							<macAddress>00000000000` + i + `</macAddress>
							<firmwareVersion>WeMo_WW_2.00.11143.PVT-OWRT-SNSV2</firmwareVersion>
							<iconList>
							  <icon>
								<mimetype>jpg</mimetype>
								<width>100</width>
								<height>100</height>
								<depth>100</depth>
								 <url>icon.jpg</url>
							  </icon>
							</iconList>
							<serviceList>
							  <service>
								<serviceType>urn:Belkin:service:WiFiSetup:1</serviceType>
								<serviceId>urn:Belkin:serviceId:WiFiSetup1</serviceId>
								<controlURL>/upnp/control/WiFiSetup1</controlURL>
								<eventSubURL>/upnp/event/WiFiSetup1</eventSubURL>
								<SCPDURL>/setupservice.xml</SCPDURL>
							  </service>
							  <service>
								<serviceType>urn:Belkin:service:timesync:1</serviceType>
								<serviceId>urn:Belkin:serviceId:timesync1</serviceId>
								<controlURL>/upnp/control/timesync1</controlURL>
								<eventSubURL>/upnp/event/timesync1</eventSubURL>
								<SCPDURL>/timesyncservice.xml</SCPDURL>
							  </service>
							  <service>
								<serviceType>urn:Belkin:service:basicevent:1</serviceType>
								<serviceId>urn:Belkin:serviceId:basicevent1</serviceId>
								<controlURL>/upnp/control/basicevent1</controlURL>
								<eventSubURL>/upnp/event/basicevent1</eventSubURL>
								<SCPDURL>/eventservice.xml</SCPDURL>
							  </service>
							  <service>
								<serviceType>urn:Belkin:service:firmwareupdate:1</serviceType>
								<serviceId>urn:Belkin:serviceId:firmwareupdate1</serviceId>
								<controlURL>/upnp/control/firmwareupdate1</controlURL>
								<eventSubURL>/upnp/event/firmwareupdate1</eventSubURL>
								<SCPDURL>/firmwareupdate.xml</SCPDURL>
							  </service>
							  <service>
								<serviceType>urn:Belkin:service:rules:1</serviceType>
								<serviceId>urn:Belkin:serviceId:rules1</serviceId>
								<controlURL>/upnp/control/rules1</controlURL>
								<eventSubURL>/upnp/event/rules1</eventSubURL>
								<SCPDURL>/rulesservice.xml</SCPDURL>
							  </service>

							  <service>
								<serviceType>urn:Belkin:service:metainfo:1</serviceType>
								<serviceId>urn:Belkin:serviceId:metainfo1</serviceId>
								<controlURL>/upnp/control/metainfo1</controlURL>
								<eventSubURL>/upnp/event/metainfo1</eventSubURL>
								<SCPDURL>/metainfoservice.xml</SCPDURL>
							  </service>

							  <service>
								<serviceType>urn:Belkin:service:remoteaccess:1</serviceType>
								<serviceId>urn:Belkin:serviceId:remoteaccess1</serviceId>
								<controlURL>/upnp/control/remoteaccess1</controlURL>
								<eventSubURL>/upnp/event/remoteaccess1</eventSubURL>
								<SCPDURL>/remoteaccess.xml</SCPDURL>
							  </service>

							  <service>
								<serviceType>urn:Belkin:service:deviceinfo:1</serviceType>
								<serviceId>urn:Belkin:serviceId:deviceinfo1</serviceId>
								<controlURL>/upnp/control/deviceinfo1</controlURL>
								<eventSubURL>/upnp/event/deviceinfo1</eventSubURL>
								<SCPDURL>/deviceinfoservice.xml</SCPDURL>
							  </service>

							  <service>
								<serviceType>urn:Belkin:service:smartsetup:1</serviceType>
								<serviceId>urn:Belkin:serviceId:smartsetup1</serviceId>
								<controlURL>/upnp/control/smartsetup1</controlURL>
								<eventSubURL>/upnp/event/smartsetup1</eventSubURL>
								<SCPDURL>/smartsetup.xml</SCPDURL>
							  </service>

							  <service>
								<serviceType>urn:Belkin:service:manufacture:1</serviceType>
								<serviceId>urn:Belkin:serviceId:manufacture1</serviceId>
								<controlURL>/upnp/control/manufacture1</controlURL>
								<eventSubURL>/upnp/event/manufacture1</eventSubURL>
								<SCPDURL>/manufacture.xml</SCPDURL>
							  </service>

							</serviceList>
						   <presentationURL>/pluginpres.html</presentationURL>
						  </device>
						</root>`
					//console.log(xml);
					response.end(xml);
				} else {
					console.log('Unhandled http ' + request.method + ' request ' + request.url);
					response.end('Hello Node.js Server!');
				}
			} else {
				//console.log('Unhandled http ' + request.method + ' request ' + request.url);
				//console.log(request.headers);
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