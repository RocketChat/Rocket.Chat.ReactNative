describe('Add server', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' } });
		// await device.reloadReactNative({ permissions: { notifications: 'YES' } });
		// await setPermissions(['notifications=YES']);
	});

	it('should have an add server screen', async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('new-server-view'))).toBeVisible();
	});

	it('should have an input to add a new server', async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('new-server-view-input'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('new-server-view-input'))).toBeVisible();
	});

	it('should insert open server and get ok', async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('new-server-view-input'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-server-view-input')).typeText('open');
	});


	it('should insert open get a valid instance for "open"', async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('new-server-view-input'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-server-view-input')).clearText();
		await element(by.id('new-server-view-input')).typeText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible();
	});

	// it('should show hello screen after tap', async () => {
	//   await element(by.id('hello_button')).tap();
	//   await expect(element(by.text('Hello!!!'))).toBeVisible();
	// });

	// it('should show world screen after tap', async () => {
	//   await element(by.id('world_button')).tap();
	//   await expect(element(by.text('World!!!'))).toBeVisible();
	// });
});
