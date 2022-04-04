const { expect } = require('chai');

describe('Verify initial app screen', () => {
	beforeEach(() => {
		driver.launchApp();
	});

	it('set workspace url', async () => {
		await $('~enter-workspace-url').setValue('mobile');
		const status = await $('~enter-workspace-url').getText();
		expect(status).to.equal('mobile');
	});
});
