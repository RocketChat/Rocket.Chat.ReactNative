import { splitRoomHeaderActions } from '../roomHeaderActions';

describe('splitRoomHeaderActions', () => {
	it('keeps every present item visible when at or under the cap', () => {
		const { visibleKeys, overflowKeys } = splitRoomHeaderActions({ threads: true, call: true });

		expect(visibleKeys).toEqual(['threads', 'call']);
		expect(overflowKeys).toEqual([]);
	});

	it('ranks threads ahead of call so an unread badge always keeps a bar item', () => {
		const { visibleKeys, overflowKeys } = splitRoomHeaderActions({ threads: true, call: true, encryption: true });

		expect(visibleKeys).toEqual(['threads', 'call']);
		expect(overflowKeys).toEqual(['encryption']);
	});

	it('demotes the lowest-ranked items to overflow when every warning is active at once', () => {
		const { visibleKeys, overflowKeys } = splitRoomHeaderActions({
			threads: true,
			call: true,
			encryption: true,
			notifications: true
		});

		expect(visibleKeys).toEqual(['threads', 'call']);
		expect(overflowKeys).toEqual(['encryption', 'notifications']);
	});

	it('promotes call to the visible cluster once threads is absent', () => {
		const { visibleKeys, overflowKeys } = splitRoomHeaderActions({
			threads: false,
			call: true,
			encryption: true,
			notifications: true
		});

		expect(visibleKeys).toEqual(['call', 'encryption']);
		expect(overflowKeys).toEqual(['notifications']);
	});

	it('returns nothing visible or overflowing when no conditional item is present', () => {
		const { visibleKeys, overflowKeys } = splitRoomHeaderActions({});

		expect(visibleKeys).toEqual([]);
		expect(overflowKeys).toEqual([]);
	});
});
