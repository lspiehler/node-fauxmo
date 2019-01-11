'use strict';

const SSDPService = require('./SSDPService');
const webService = require('./webService');

module.exports = function(fauxMo) {
	SSDPService.startSSDPServer(fauxMo);
	webService.startWebServer(fauxMo);
}