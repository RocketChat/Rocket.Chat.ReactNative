const { exec } = require('child_process');
const { device } = require('detox');

function runCommand(command) {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`exec error: ${ stderr }`));
				return;
			}
			resolve();
		});
	});
}

// The Spell Checker and the autofill service introduce additional flakiness, and appear over other elements.
// So, we disable them before running the tests.
exports.prepareAndroid = async() => {
	if (device.getPlatform() !== 'android') {
		return;
	}
	await runCommand('adb shell settings put secure spell_checker_enabled 0');
	await runCommand('adb shell settings put secure autofill_service null');
};

exports.closeKeyboardAndroid = async() => {
	await device.pressBack(); // Android-only
};
