import { hasOwnKey } from '../hasOwnKey';

describe('hasOwnKey', () => {
	it('returns true for an own key', () => {
		expect(hasOwnKey({ a: 1 }, 'a')).toBe(true);
	});

	it('returns false for an inherited key', () => {
		expect(hasOwnKey({ a: 1 }, 'toString')).toBe(false);
	});

	it('returns false for a missing key', () => {
		expect(hasOwnKey({ a: 1 }, 'b')).toBe(false);
	});

	it('returns true for an own key on a null-prototype object', () => {
		const table = Object.assign(Object.create(null), { a: 1 });
		expect(hasOwnKey(table, 'a')).toBe(true);
	});

	it('narrows the key to a key of the object', () => {
		const table = { online: 'Online', away: 'Away' };
		const key: string = 'away';
		expect(hasOwnKey(table, key) ? table[key] : 'unknown').toBe('Away');
	});
});
