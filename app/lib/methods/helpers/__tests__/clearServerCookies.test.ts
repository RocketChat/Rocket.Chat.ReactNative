import CookieManager from '@react-native-cookies/cookies';

import { clearServerCookies } from '../clearServerCookies';

jest.mock('@react-native-cookies/cookies', () => ({
	setFromResponse: jest.fn(() => Promise.resolve(true)),
	flush: jest.fn(() => Promise.resolve())
}));

const mockedSetFromResponse = CookieManager.setFromResponse as jest.Mock;

const cookieStringFor = (name: string) =>
	mockedSetFromResponse.mock.calls.find(([, cookie]) => (cookie as string).startsWith(`${name}=`))?.[1] as string;

describe('clearServerCookies', () => {
	beforeEach(() => {
		mockedSetFromResponse.mockClear();
	});

	test('expires both credential cookies', async () => {
		await clearServerCookies('https://open.rocket.chat');

		expect(cookieStringFor('rc_uid')).toContain('rc_uid=;');
		expect(cookieStringFor('rc_token')).toContain('rc_token=;');
	});

	test('dates the cookies to the past so the store drops them', async () => {
		await clearServerCookies('https://open.rocket.chat');

		const expires = cookieStringFor('rc_token').match(/Expires=([^;]+)/i)?.[1] as string;
		expect(new Date(expires).getTime()).toBeLessThan(Date.now());
	});

	test('only touches the given server', async () => {
		await clearServerCookies('https://open.rocket.chat');

		mockedSetFromResponse.mock.calls.forEach(([url]) => expect(url).toEqual('https://open.rocket.chat'));
	});

	test('clears a root server with a single path', async () => {
		await clearServerCookies('https://open.rocket.chat');

		expect(mockedSetFromResponse).toHaveBeenCalledTimes(2);
	});

	test('clears a subpath workspace and the legacy root path', async () => {
		await clearServerCookies('https://example.com/chat');

		const paths = mockedSetFromResponse.mock.calls.map(([, cookie]) => (cookie as string).match(/Path=([^;]+)/i)?.[1]);
		expect(paths).toEqual(expect.arrayContaining(['/chat', '/']));
		expect(mockedSetFromResponse).toHaveBeenCalledTimes(4);
	});

	test('does nothing without a server', async () => {
		await clearServerCookies('');

		expect(mockedSetFromResponse).not.toHaveBeenCalled();
	});
});
