import CookieManager from '@react-native-cookies/cookies';

import { setServerCookies } from './setServerCookies';

jest.mock('@react-native-cookies/cookies', () => ({ setFromResponse: jest.fn(() => Promise.resolve(true)) }));

const mockedSetFromResponse = CookieManager.setFromResponse as jest.Mock;

const cookieStringFor = (name: string) =>
	mockedSetFromResponse.mock.calls.find(([, cookie]) => (cookie as string).startsWith(`${name}=`))?.[1] as string;

describe('setServerCookies', () => {
	beforeEach(() => {
		mockedSetFromResponse.mockClear();
	});

	test('sets the pair the server authenticates a page load with', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).toContain('rc_uid=uid1');
		expect(cookieStringFor('rc_token')).toContain('rc_token=tok1');
	});

	test('scopes the cookies to the server', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(mockedSetFromResponse).toHaveBeenCalledWith('https://open.rocket.chat', expect.anything());
	});

	test('omits Domain so the cookies stay host-only', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).not.toMatch(/domain=/i);
		expect(cookieStringFor('rc_token')).not.toMatch(/domain=/i);
	});

	test('marks cookies secure on https', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).toMatch(/;\s*Secure/i);
		expect(cookieStringFor('rc_token')).toMatch(/;\s*Secure/i);
	});

	test('refuses cleartext servers without writing cookies', async () => {
		await expect(setServerCookies('http://open.rocket.chat', { id: 'uid1', token: 'tok1' })).rejects.toThrow();

		expect(mockedSetFromResponse).not.toHaveBeenCalled();
	});

	test('allows loopback http for local dev without the secure flag', async () => {
		await setServerCookies('http://localhost:3000', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).toContain('rc_uid=uid1');
		expect(cookieStringFor('rc_uid')).not.toMatch(/;\s*Secure/i);
	});

	test('sends the cookies on every path', async () => {
		await setServerCookies('https://example.com/chat', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).toMatch(/;\s*Path=\//i);
	});

	test('expires the cookies in the future', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		const expires = cookieStringFor('rc_uid').match(/Expires=([^;]+)/i)?.[1] as string;
		expect(new Date(expires).getTime()).toBeGreaterThan(Date.now());
	});
});
