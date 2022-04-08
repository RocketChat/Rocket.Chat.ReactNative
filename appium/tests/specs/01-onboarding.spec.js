const data = require('../../../e2e/data');
// const { platformTypes } = require('../../../e2e/helpers/app');

describe('Onboarding', () => {
	// let alertButtonType;
	// let textMatcher;
	before(async () => {
		await driver.closeApp();
		await driver.launchApp();
		// await $('~new-server-view').toExis
		// await waitFor(element(by.id('new-server-view')))
		// 	.toBeVisible()
		// 	.withTimeout(20000);
	});

	// describe('Render', () => {
	// 	it('should have onboarding screen', async () => {
	// 		await expect(element(by.id('new-server-view'))).toBeVisible();
	// 	});

	// 	it('should have "Join our open workspace"', async () => {
	// 		await expect(element(by.id('new-server-view-open'))).toBeVisible();
	// 	});
	// });

	describe('Usage', () => {
		it('should enter an invalid server and get error', async () => {
			await $('~new-server-view-input').addValue('invalidtest');
			// await $('new-server-view-input').
			// await waitFor(element(by[textMatcher]('Oops!')))
			// 	.toExist()
			// 	.withTimeout(10000);
			// await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
		});

		// it('should tap on "Join our open workspace" and navigate', async () => {
		// 	await element(by.id('new-server-view-open')).tap();
		// 	await waitFor(element(by.id('workspace-view')))
		// 		.toBeVisible()
		// 		.withTimeout(60000);
		// });

		// it('should enter a valid server without login services and navigate to login', async () => {
		// 	await device.launchApp({ newInstance: true });
		// 	await waitFor(element(by.id('new-server-view')))
		// 		.toBeVisible()
		// 		.withTimeout(5000);
		// 	await element(by.id('new-server-view-input')).replaceText(data.server);
		// 	await element(by.id('new-server-view-input')).tapReturnKey();
		// 	await waitFor(element(by.id('workspace-view')))
		// 		.toBeVisible()
		// 		.withTimeout(60000);
		// });
	});
});
