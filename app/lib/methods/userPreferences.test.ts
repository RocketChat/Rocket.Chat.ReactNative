import userPreferences from './userPreferences';

describe('UserPreferences', () => {
	beforeEach(() => userPreferences.clearAll());

	it('getBool returns false for stored false', () => {
		userPreferences.setBool('k', false);
		expect(userPreferences.getBool('k')).toBe(false);
	});

	it('getBool returns null for unset key', () => {
		expect(userPreferences.getBool('missing')).toBeNull();
	});

	it('getNumber returns 0 for stored 0', () => {
		userPreferences.setNumber('k', 0);
		expect(userPreferences.getNumber('k')).toBe(0);
	});

	it('getNumber returns null for unset key', () => {
		expect(userPreferences.getNumber('missing')).toBeNull();
	});
});
