import * as WebBrowser from 'expo-web-browser';

import { onPressGoogle } from '../serviceLogin';

jest.mock('expo-web-browser', () => ({
	openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' }))
}));

jest.mock('../../../lib/services/connect', () => ({
	loginOAuthOrSso: jest.fn()
}));

const service = {
	_id: 'google',
	name: 'google',
	service: 'google',
	authType: 'oauth',
	buttonColor: '#fff',
	buttonLabelColor: '#000',
	clientConfig: { provider: 'google' },
	serverURL: '',
	authorizePath: '',
	clientId: 'client-id',
	scope: ''
} as const;

describe('onPressGoogle', () => {
	it('opens the Google OAuth URL with prompt=select_account', () => {
		onPressGoogle({ service, server: 'https://mpbila.qa.rocket.chat' });

		const url = (WebBrowser.openAuthSessionAsync as jest.Mock).mock.calls[0][0];
		expect(url).toContain('accounts.google.com/o/oauth2/auth');
		expect(url).toContain('prompt=select_account');
	});
});
