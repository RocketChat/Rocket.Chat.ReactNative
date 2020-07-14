const detox = require('detox');
const config = require('../../package.json').detox;
const dataSetup = require('../helpers/data_setup')

before(async() => {
	await dataSetup()
	await detox.init(config, { launchApp: false });
	await device.launchApp({ permissions: { notifications: 'YES' } });
});

after(async() => {
	await detox.cleanup();
});
