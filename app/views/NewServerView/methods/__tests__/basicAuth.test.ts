import { Base64 } from 'js-base64';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import basicAuth from '../basicAuth';
import { getBasicAuthKey } from '~/lib/constants/keys';
import UserPreferences from '~/lib/methods/userPreferences';

jest.mock('~/lib/methods/userPreferences', () => ({
	__esModule: true,
	default: { setString: jest.fn() }
}));

describe('basicAuth', () => {
	beforeEach(() => {
		jest.mocked(UserPreferences.setString).mockClear();
	});

	it('stores the credentials for the server without changing the global headers', () => {
		const customHeaders = RocketChatSettings.customHeaders;

		basicAuth('https://workspace.example', 'https://user:pass@workspace.example');

		expect(UserPreferences.setString).toHaveBeenCalledWith(
			getBasicAuthKey('https://workspace.example'),
			Base64.encode('user:pass')
		);
		expect(RocketChatSettings.customHeaders).toBe(customHeaders);
	});

	it('stores nothing when the url carries no credentials', () => {
		basicAuth('https://workspace.example', 'https://workspace.example');

		expect(UserPreferences.setString).not.toHaveBeenCalled();
	});
});
