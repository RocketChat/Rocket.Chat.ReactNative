const {
	expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { tapBack, sleep } = require('./helpers/app');
const data = require('./data');

describe('Directory', () => {
	before(async () => {
		await element(by.id('rooms-list-view-directory')).tap();
	});

	describe('Render', async() => {
		it('should display directory screen', async() => {
			await expect(element(by.id('directory-view'))).toBeVisible();
    });

		it('should display directory screen search input', async() => {
			await expect(element(by.id('directory-view-search'))).toBeVisible();
		});

		it('should have directory list items', async() => {
			await expect(element(by.id('directory-view-list-item-general'))).toExist();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		it('should search channel and open room view', async() => {
			const room = `public${ data.random}`;

			// check filter drop-down value = Channels
			await waitFor(element(by.id('directory-view-filter-text'))).toHaveValue('Channels').withTimeout(2000);
			// search for 'general' channel
			await element(by.id('directory-view-search')).tap();
			await element(by.id('directory-view-search')).typeText(`${room}\n`);
			await sleep(2000);
			await waitFor(element(by.id(`directory-view-list-item-${room}`))).toBeVisible().withTimeout(60000);
			await expect(element(by.id(`directory-view-list-item-${room}`))).toBeVisible();
			// open Room View
			await element(by.id(`directory-view-list-item-${room}`)).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.text(room))).toBeVisible().withTimeout(60000);
			await expect(element(by.text(room))).toBeVisible();
			// go back to Directory view
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
			await element(by.id('rooms-list-view-directory')).tap();
			await waitFor(element(by.id('directory-view-list-item-general'))).toExist().withTimeout(60000);
			await expect(element(by.id('directory-view-list-item-general'))).toExist();
		});

		it('should search user and open room view', async() => {
			// check filter drop-down value = Channels
			await waitFor(element(by.id('directory-view-filter-text'))).toHaveValue('Channels').withTimeout(2000);
			// change filter to Users
			await element(by.id('directory-view-filter-drop-down')).tap();
			await element(by.id('directory-view-filter-drop-down-users')).tap();
			await element(by.id('directory-view-filter-drop-down-close')).tap();
			await waitFor(element(by.id('directory-view-filter-text'))).toHaveValue('Users').withTimeout(2000);
			// search user rocket.cat
			await element(by.id('directory-view-search')).tap();
			await element(by.id('directory-view-search')).typeText('Rocket.Cat\n');
			await sleep(2000);
			await waitFor(element(by.id('directory-view-list-item-Rocket.Cat'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('directory-view-list-item-Rocket.Cat'))).toBeVisible();
			// go to Room View
			await element(by.id('directory-view-list-item-Rocket.Cat')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.text('rocket.cat'))).toBeVisible().withTimeout(60000);
			await expect(element(by.text('rocket.cat'))).toBeVisible();
			// return back to directory view
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
			await element(by.id('rooms-list-view-directory')).tap();
			await waitFor(element(by.id('directory-view-list-item-general'))).toExist().withTimeout(60000);
			await expect(element(by.id('directory-view-list-item-general'))).toExist();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});

	after(async() => {
		await tapBack();
	});
});
