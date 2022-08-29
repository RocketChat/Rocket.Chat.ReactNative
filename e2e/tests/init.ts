import detox from 'detox';
import adapter from 'detox/runners/mocha/adapter';

import { detox as config } from '../../package.json';
import { setup } from '../helpers/data_setup';
import { prepareAndroid } from '../helpers/app';

before(async () => {
	// @ts-ignore
	await Promise.all([setup(), detox.init(config, { launchApp: false })]);
	await prepareAndroid(); // Make Android less flaky
	// await dataSetup()
	// await detox.init(config, { launchApp: false });
	// await device.launchApp({ permissions: { notifications: 'YES' } });
});

beforeEach(async function () {
	// @ts-ignore
	await adapter.beforeEach(this);
});

afterEach(async function () {
	// @ts-ignore
	await adapter.afterEach(this);
});

after(async () => {
	await detox.cleanup();
});
