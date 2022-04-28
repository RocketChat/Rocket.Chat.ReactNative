const { launchApp, equal, getText } = require('../helpers');
const { login, logout } = require('../helpers/login');

describe('Onboarding', () => {
	before(() => {
		launchApp();
	});

	describe('Login', () => {
		it('Login in app', async () => {
			await login();
		});

		it('Logout in app', async () => {
			await logout();
			const login = await getText('new-server-view-input');
			equal(login, 'Ex. your-company.rocket.chat');
		});
	});
});
