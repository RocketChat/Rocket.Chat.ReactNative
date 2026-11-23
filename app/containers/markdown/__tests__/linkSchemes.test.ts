import { isInternalLink, parseInternalLink } from '../linkSchemes';

describe('parseInternalLink', () => {
	it.each([
		['user://u1', { type: 'user', rid: 'u1', kind: 'user' }],
		['user://u1?me=1', { type: 'user', rid: 'u1', kind: 'me' }],
		['user://t1?team=1', { type: 'user', rid: 't1', kind: 'team' }],
		['user://all', { type: 'user', rid: 'all', kind: 'user' }],
		['channel://c1', { type: 'channel', rid: 'c1' }],
		['timestamp://1735689600', { type: 'timestamp', unixSeconds: 1735689600 }]
	])('reads %s', (url, expected) => {
		expect(parseInternalLink(url)).toEqual(expected);
	});

	it('leaves web links to the browser', () => {
		expect(parseInternalLink('https://rocket.chat')).toBeNull();
	});
});

describe('isInternalLink', () => {
	it('treats any casing of an internal scheme as internal so a user-written link cannot pose as one', () => {
		expect(isInternalLink('USER://u1')).toBe(true);
		expect(isInternalLink('Channel://c1')).toBe(true);
		expect(isInternalLink('https://user.example')).toBe(false);
	});
});
