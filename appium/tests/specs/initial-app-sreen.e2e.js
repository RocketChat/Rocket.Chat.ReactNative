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

	it('set workspace url and login', async () => {
		await $('~enter-workspace-url').setValue('mobile');
		await $('~new-server-view-button').click();
		const register = await $('//android.widget.TextView[@content-desc="Create an account"]').getText();
		expect(register).to.equal('Create an account');
	});
});
