const { config } = require('./wdio.conf');
const android = require('./android.info');
// const path = require('path');

// appium capabilities
config.capabilities = [
	{
		platformName: 'Android',
		automationName: 'uiautomator2',
		maxInstances: 1,
		noReset: true,
		fullReset: false,
		deviceName: android.deviceName,
		platformVersion: android.platformVersion,
		appPackage: android.appPackage,
		appActivity: android.appActivity
		// app: path.resolve('apps/' + android.app)
	}
];

exports.config = config;
