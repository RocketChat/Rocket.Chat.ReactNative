import CookieManager from '@react-native-cookies/cookies';

import { setServerCookies } from './setServerCookies';

jest.mock('@react-native-cookies/cookies', () => ({ set: jest.fn(() => Promise.resolve(true)) }));

const mockedSet = CookieManager.set as jest.Mock;

const cookieFor = (name: string) => mockedSet.mock.calls.find(([, cookie]) => cookie.name === name)?.[1];

describe('setServerCookies', () => {
	beforeEach(() => {
		mockedSet.mockClear();
	});

	test('sets the pair the server authenticates a page load with', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(cookieFor('rc_uid')).toEqual(expect.objectContaining({ value: 'uid1' }));
		expect(cookieFor('rc_token')).toEqual(expect.objectContaining({ value: 'tok1' }));
	});

	test('scopes the cookies to the server', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(mockedSet).toHaveBeenCalledWith('https://open.rocket.chat', expect.anything());
	});

	test('strips the scheme from the domain', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(cookieFor('rc_uid').domain).toEqual('open.rocket.chat');
	});

	test('strips the port from the domain', async () => {
		await setServerCookies('http://localhost:3000', { id: 'uid1', token: 'tok1' });

		expect(cookieFor('rc_uid').domain).toEqual('localhost');
	});

	test('strips a subpath from the domain', async () => {
		await setServerCookies('https://example.com/chat', { id: 'uid1', token: 'tok1' });

		expect(cookieFor('rc_uid').domain).toEqual('example.com');
	});

	test('expires the cookies in the future', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(new Date(cookieFor('rc_uid').expires).getTime()).toBeGreaterThan(Date.now());
	});
});
