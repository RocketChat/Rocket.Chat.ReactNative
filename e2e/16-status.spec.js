const {
	expect, element, by, waitFor
} = require('detox');
const { sleep } = require('./helpers/app');

async function waitForToast() {
	await sleep(5000);
}

describe('Status screen', () => {
	before(async() => {
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('sidebar-custom-status'))).toBeVisible().withTimeout(2000);

		await element(by.id('sidebar-custom-status')).tap();
		await waitFor(element(by.id('status-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have status input', async() => {
      await expect(element(by.id('status-view-input'))).toBeVisible();
      await expect(element(by.id('status-view-online'))).toExist();
			await expect(element(by.id('status-view-busy'))).toExist();
			await expect(element(by.id('status-view-away'))).toExist();
			await expect(element(by.id('status-view-offline'))).toExist();
    });
  });
  
  describe('Usage', async() => {
		it('should change status', async() => {
      await element(by.id('status-view-busy')).tap();
      sleep(1000);
      await expect(element(by.id('status-view-current-busy'))).toExist();
    });

    it('should change status text', async() => {
			await element(by.id('status-view-input')).replaceText('status-text-new');
			await sleep(1000);
			await element(by.id('status-view-submit')).tap();
			await waitForToast();
    });
  });
});
