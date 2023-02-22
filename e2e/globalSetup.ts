import { setup } from './helpers/data_setup';

module.exports = async () => {
	await require('detox/runners/jest/index').globalSetup();
	// await setup();
};
