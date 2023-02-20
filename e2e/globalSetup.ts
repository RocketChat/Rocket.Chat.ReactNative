import { setup } from './helpers/data_setup';
import random from './helpers/random';

// declare global {
// 	// eslint-disable-next-line no-var
// 	var random: string;
// }

module.exports = async () => {
	await require('detox/runners/jest/index').globalSetup();
	// @ts-ignore
	globalThis.random = random(20);
	await setup();
};
