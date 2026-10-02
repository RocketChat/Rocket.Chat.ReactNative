import CookieManager from '@react-native-cookies/cookies';

import { clearServerCookies, setServerCookies } from './setServerCookies';

jest.mock('@react-native-cookies/cookies', () => ({
	setFromResponse: jest.fn(() => Promise.resolve(true)),
	flush: jest.fn(() => Promise.resolve())
}));

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

	test('rejects loopback http as defense in depth, even for local dev', async () => {
		await expect(setServerCookies('http://localhost:3000', { id: 'uid1', token: 'tok1' })).rejects.toThrow();

		expect(mockedSetFromResponse).not.toHaveBeenCalled();
	});

	test('keeps Path=/ for a root server', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).toMatch(/;\s*Path=\/(;|$)/);
	});

	test('scopes the cookie path to a subpath workspace', async () => {
		await setServerCookies('https://example.com/chat', { id: 'uid1', token: 'tok1' });

		expect(cookieStringFor('rc_uid')).toMatch(/;\s*Path=\/chat(;|$)/);
		expect(cookieStringFor('rc_token')).toMatch(/;\s*Path=\/chat(;|$)/);
	});

	test('isolates two workspaces sharing a host', async () => {
		await setServerCookies('https://example.com/chat-a', { id: 'uid1', token: 'tok1' });
		await setServerCookies('https://example.com/chat-b', { id: 'uid2', token: 'tok2' });

		const paths = mockedSetFromResponse.mock.calls.map(([, cookie]) => (cookie as string).match(/Path=([^;]+)/i)?.[1]);
		expect(paths.slice(0, 2)).toEqual(['/chat-a', '/chat-a']);
		expect(paths.slice(2, 4)).toEqual(['/chat-b', '/chat-b']);
	});

	test('expires the cookies in the future', async () => {
		await setServerCookies('https://open.rocket.chat', { id: 'uid1', token: 'tok1' });

		const expires = cookieStringFor('rc_uid').match(/Expires=([^;]+)/i)?.[1] as string;
		expect(new Date(expires).getTime()).toBeGreaterThan(Date.now());
	});

	test.each([
		['uid; Domain=evil.example.com', 'tok1'],
		['uid1', 'tok; Domain=evil.example.com'],
		['uid\r\nSet-Cookie: x=y', 'tok1'],
		['uid1', 'tok\nSet-Cookie: x=y']
	])('rejects unsafe credential values without writing cookies (%p)', async (id, token) => {
		await expect(setServerCookies('https://open.rocket.chat', { id, token })).rejects.toThrow();

		expect(mockedSetFromResponse).not.toHaveBeenCalled();
	});

	test('rejects a workspace path that would inject cookie attributes', async () => {
		await expect(
			setServerCookies('https://example.com/chat;Domain=evil.example.com', { id: 'uid1', token: 'tok1' })
		).rejects.toThrow();

		expect(mockedSetFromResponse).not.toHaveBeenCalled();
	});
});

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
