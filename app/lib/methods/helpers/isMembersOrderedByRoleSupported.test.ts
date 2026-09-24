import { isMembersOrderedByRoleSupported } from './isMembersOrderedByRoleSupported';

describe('isMembersOrderedByRoleSupported', () => {
	it.each(['c', 'p'])('returns true for room type %s on 7.3.0', roomType => {
		expect(isMembersOrderedByRoleSupported('7.3.0', roomType)).toBe(true);
	});

	it('returns true for newer servers', () => {
		expect(isMembersOrderedByRoleSupported('8.1.2', 'c')).toBe(true);
	});

	it('returns false for servers older than 7.3.0', () => {
		expect(isMembersOrderedByRoleSupported('7.2.9', 'c')).toBe(false);
	});

	it.each(['d', 'l'])('returns false for room type %s', roomType => {
		expect(isMembersOrderedByRoleSupported('8.0.0', roomType)).toBe(false);
	});

	it('returns false when the server version is unknown', () => {
		expect(isMembersOrderedByRoleSupported(null, 'c')).toBe(false);
	});
});
