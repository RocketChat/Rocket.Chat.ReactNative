exports.config = {
	services: ['appium'],
	port: 4723,
	runner: 'local',
	specs: ['./tests/specs/**/*.js'],
	path: '/wd/hub/',
	capabilities: [
		{
			maxInstances: 1,
			browserName: '',
			appiumVersion: '1.22.3',
			// app: 'android-official-release.apk',
			platformName: 'Android',
			platformVersion: '11',
			deviceName: 'emulator',
			automationName: 'UiAutomator2',
			appPackage: 'chat.rocket.reactnative',
			appActivity: 'chat.rocket.reactnative.MainActivity'
		}
	],

	logLevel: 'trace',
	bail: 0,
	waitforTimeout: 10000,
	connectionRetryTimeout: 90000,
	connectionRetryCount: 3,
	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 60000
	}
};
