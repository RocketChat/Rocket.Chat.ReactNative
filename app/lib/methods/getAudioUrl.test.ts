import { getAudioUrl, getAudioUrlToCache } from './getAudioUrl';

describe('getAudioUrl', () => {
	it('prefixes non-http url with cdn/base and returns absolute url', () => {
		expect(getAudioUrl({ audioUrl: '/file.mp3', baseUrl: 'https://open.rocket.chat', cdnPrefix: '' })).toBe(
			'https://open.rocket.chat/file.mp3'
		);
		expect(getAudioUrl({ audioUrl: '/file.mp3', baseUrl: 'https://open.rocket.chat', cdnPrefix: 'https://cdn.test' })).toBe(
			'https://cdn.test/file.mp3'
		);
	});

	it('returns an already-http(s) url unchanged', () => {
		expect(getAudioUrl({ audioUrl: 'https://cdn.test/file.mp3', baseUrl: 'https://open.rocket.chat', cdnPrefix: '' })).toBe(
			'https://cdn.test/file.mp3'
		);
		expect(getAudioUrl({ audioUrl: 'http://cdn.test/file.mp3', baseUrl: 'https://open.rocket.chat', cdnPrefix: '' })).toBe(
			'http://cdn.test/file.mp3'
		);
	});
});

describe('getAudioUrlToCache', () => {
	it('appends rc_uid/rc_token query params to the resolved url', () => {
		expect(getAudioUrlToCache({ url: 'https://open.rocket.chat/file.mp3', userId: 'u1', token: 't1' })).toBe(
			'https://open.rocket.chat/file.mp3?rc_uid=u1&rc_token=t1'
		);
	});

	it('composes correctly when the base url already carries a query string', () => {
		expect(getAudioUrlToCache({ url: 'https://open.rocket.chat/file.mp3?x=1', userId: 'u1', token: 't1' })).toBe(
			'https://open.rocket.chat/file.mp3?x=1&rc_uid=u1&rc_token=t1'
		);
	});

	it('returns empty input unchanged when url is missing', () => {
		expect(getAudioUrlToCache({ url: undefined, userId: 'u1', token: 't1' })).toBeUndefined();
		expect(getAudioUrlToCache({ url: '', userId: 'u1', token: 't1' })).toBe('');
	});
});
