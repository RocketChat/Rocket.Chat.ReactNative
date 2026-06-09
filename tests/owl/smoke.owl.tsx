/* eslint-env jest */

import { press, reload, takeScreenshot, toExist } from 'react-native-owl';

jest.setTimeout(60000);

describe('Owl smoke fixture', () => {
	beforeEach(async () => {
		await reload();
	});

	it('matches the default fixture state', async () => {
		const screen = await takeScreenshot('smoke-initial');

		expect(screen).toMatchBaseline();
	});

	it('matches the expanded fixture state', async () => {
		await press('owl-smoke-toggle');
		await toExist('owl-smoke-expanded');

		const screen = await takeScreenshot('smoke-expanded');

		expect(screen).toMatchBaseline();
	});
});
