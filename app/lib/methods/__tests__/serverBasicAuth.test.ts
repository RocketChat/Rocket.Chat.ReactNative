import { getBasicAuthHeaderForUrl } from '../serverBasicAuth';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';

describe('getBasicAuthHeaderForUrl', () => {
	const server = 'https://open.rocket.chat';

	beforeEach(() => {
		UserPreferences.setString(getBasicAuthKey(server), 'server-credentials');
	});

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(server));
	});

	it('returns the stored basic auth for a url on the same origin as the server', () => {
		expect(getBasicAuthHeaderForUrl(`${server}/sso/api?token=1`, server)).toBe('Basic server-credentials');
	});

	it('treats the default port as the same origin', () => {
		expect(getBasicAuthHeaderForUrl('https://open.rocket.chat:443/sso/api', server)).toBe('Basic server-credentials');
	});

	it('returns undefined for a different host', () => {
		expect(getBasicAuthHeaderForUrl('https://sso.example.com/api', server)).toBeUndefined();
	});

	it('returns undefined for a host that only starts with the server host', () => {
		expect(getBasicAuthHeaderForUrl('https://open.rocket.chat.evil.example/api', server)).toBeUndefined();
	});

	it('returns undefined for the same host over another scheme or port', () => {
		expect(getBasicAuthHeaderForUrl('http://open.rocket.chat/api', server)).toBeUndefined();
		expect(getBasicAuthHeaderForUrl('https://open.rocket.chat:8443/api', server)).toBeUndefined();
	});

	it('returns undefined when the url is not absolute', () => {
		expect(getBasicAuthHeaderForUrl('/sso/api', server)).toBeUndefined();
		expect(getBasicAuthHeaderForUrl('', server)).toBeUndefined();
	});

	it('returns undefined when the server has no stored basic auth', () => {
		UserPreferences.removeItem(getBasicAuthKey(server));

		expect(getBasicAuthHeaderForUrl(`${server}/sso/api`, server)).toBeUndefined();
	});
});
