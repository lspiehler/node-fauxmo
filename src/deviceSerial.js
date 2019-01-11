const crypto = require('crypto');

module.exports = function(device) {
	let rawserial = crypto.createHash('md5').update(JSON.stringify(device.port)).digest("hex");
	//console.log(rawserial);
	return rawserial.substring(0, 8) + '-' + rawserial.substring(8, 12) + '-' + rawserial.substring(12, 16) + '-' + rawserial.substring(16, 20) + '-' + rawserial.substring(20, 32);
}
