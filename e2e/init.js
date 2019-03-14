const detox = require('detox');
const config = require('../package.json').detox;

before(async() => {
	await detox.init(config, { launchApp: false });
	await device.launchApp({ permissions: { notifications: 'YES' } });
});

after(async() => {
	await detox.cleanup();
});
