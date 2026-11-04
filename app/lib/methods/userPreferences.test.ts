import { act, renderHook } from '@testing-library/react-native';

import userPreferences, { useUserPreferences } from './userPreferences';

describe('UserPreferences', () => {
	beforeEach(() => userPreferences.clearAll());

	describe('string', () => {
		it('round-trips a stored string', () => {
			userPreferences.setString('k', 'value');
			expect(userPreferences.getString('k')).toBe('value');
		});

		it('getString returns null for unset key', () => {
			expect(userPreferences.getString('missing')).toBeNull();
		});

		it('getString returns null for an empty string', () => {
			userPreferences.setString('k', '');
			expect(userPreferences.getString('k')).toBeNull();
		});
	});

	describe('bool', () => {
		it('getBool returns false for stored false', () => {
			userPreferences.setBool('k', false);
			expect(userPreferences.getBool('k')).toBe(false);
		});

		it('getBool parses JSON-string stored boolean', () => {
			userPreferences.setString('k', JSON.stringify(false));
			expect(userPreferences.getBool('k')).toBe(false);
			userPreferences.setString('k', JSON.stringify(true));
			expect(userPreferences.getBool('k')).toBe(true);
		});

		it('getBool returns null for non-boolean or invalid JSON strings', () => {
			for (const value of ['1', 'null', '{}', 'not-json']) {
				userPreferences.setString('k', value);
				expect(userPreferences.getBool('k')).toBeNull();
			}
		});

		it('getBool returns null for unset key', () => {
			expect(userPreferences.getBool('missing')).toBeNull();
		});
	});

	describe('number', () => {
		it('getNumber returns 0 for stored 0', () => {
			userPreferences.setNumber('k', 0);
			expect(userPreferences.getNumber('k')).toBe(0);
		});

		it('getNumber returns null for unset key', () => {
			expect(userPreferences.getNumber('missing')).toBeNull();
		});
	});

	describe('map', () => {
		it('round-trips a stored object', () => {
			userPreferences.setMap('k', { sort: 'activity', group: true });
			expect(userPreferences.getMap('k')).toEqual({ sort: 'activity', group: true });
		});

		it('getMap returns null for unset key', () => {
			expect(userPreferences.getMap('missing')).toBeNull();
		});

		it('getMap returns null when the stored string is not JSON', () => {
			userPreferences.setString('k', 'not-json');
			expect(userPreferences.getMap('k')).toBeNull();
		});
	});

	describe('key management', () => {
		it('contains reports whether a key is stored', () => {
			expect(userPreferences.contains('k')).toBe(false);
			userPreferences.setString('k', 'value');
			expect(userPreferences.contains('k')).toBe(true);
		});

		it('removeItem drops a single key', () => {
			userPreferences.setString('keep', 'a');
			userPreferences.setString('drop', 'b');
			userPreferences.removeItem('drop');
			expect(userPreferences.contains('drop')).toBe(false);
			expect(userPreferences.getString('keep')).toBe('a');
		});

		it('getAllKeys lists every stored key', () => {
			userPreferences.setString('a', '1');
			userPreferences.setBool('b', true);
			userPreferences.setNumber('c', 2);
			expect(userPreferences.getAllKeys().sort()).toEqual(['a', 'b', 'c']);
		});

		it('clearAll empties the storage', () => {
			userPreferences.setString('a', '1');
			userPreferences.clearAll();
			expect(userPreferences.getAllKeys()).toEqual([]);
		});
	});

	describe('useUserPreferences', () => {
		it('returns the default value when nothing is stored', () => {
			const { result } = renderHook(() => useUserPreferences('k', 'fallback'));
			expect(result.current[0]).toBe('fallback');
		});

		it('returns undefined when nothing is stored and no default is given', () => {
			const { result } = renderHook(() => useUserPreferences('k'));
			expect(result.current[0]).toBeUndefined();
		});

		it('reads back a string written through the setter', () => {
			const { result } = renderHook(() => useUserPreferences('k', 'fallback'));

			act(() => result.current[1]('written'));

			expect(result.current[0]).toBe('written');
			expect(userPreferences.getString('k')).toBe('written');
		});

		it('round-trips a non-string value as JSON', () => {
			const { result } = renderHook(() => useUserPreferences<{ sort: string }>('k', { sort: 'alphabetical' }));

			act(() => result.current[1]({ sort: 'activity' }));

			expect(result.current[0]).toEqual({ sort: 'activity' });
			expect(userPreferences.getMap('k')).toEqual({ sort: 'activity' });
		});

		it('falls back to the default when the stored string is not valid JSON', () => {
			userPreferences.setString('k', 'not-json');
			const { result } = renderHook(() => useUserPreferences<{ sort: string }>('k', { sort: 'alphabetical' }));

			expect(result.current[0]).toEqual({ sort: 'alphabetical' });
		});

		it('clears the stored value when set to undefined', () => {
			userPreferences.setString('k', 'written');
			const { result } = renderHook(() => useUserPreferences('k', 'fallback'));

			act(() => result.current[1](undefined));

			expect(userPreferences.contains('k')).toBe(false);
			expect(result.current[0]).toBe('fallback');
		});
	});
});
