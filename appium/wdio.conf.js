exports.config = {
	path: '/wd/hub',
	port: 4723,
	capabilities: [
		{
			maxInstances: 1,
			browserName: '',
			appiumVersion: '1.22.3',
			// app: 'android-official-release.apk',
			platformName: 'Android',
			platformVersion: '12',
			deviceName: 'emulator',
			automationName: 'UiAutomator2',
			appPackage: 'chat.rocket.reactnative',
			appActivity: 'chat.rocket.reactnative.MainActivity'
		}
	],
	specs: ['./tests/specs/**/*.js']
};
