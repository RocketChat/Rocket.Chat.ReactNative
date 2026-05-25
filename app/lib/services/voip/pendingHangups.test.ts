import { pendingHangups } from './pendingHangups';

describe('pendingHangups', () => {
	beforeEach(() => {
		pendingHangups.clear();
	});

	it('drainAll returns and clears recorded ids in insertion order', () => {
		pendingHangups.record('call-a');
		pendingHangups.record('call-b');

		expect(pendingHangups.size).toBe(2);
		expect(pendingHangups.drainAll()).toEqual(['call-a', 'call-b']);
		expect(pendingHangups.size).toBe(0);
		expect(pendingHangups.drainAll()).toEqual([]);
	});

	it('record is idempotent on the same id', () => {
		pendingHangups.record('call-a');
		pendingHangups.record('call-a');

		expect(pendingHangups.drainAll()).toEqual(['call-a']);
	});

	it('remove deletes a single recorded id', () => {
		pendingHangups.record('call-a');
		pendingHangups.record('call-b');
		pendingHangups.remove('call-a');

		expect(pendingHangups.size).toBe(1);
		expect(pendingHangups.drainAll()).toEqual(['call-b']);
	});

	it('remove on a missing id is a no-op', () => {
		pendingHangups.record('call-a');
		expect(() => pendingHangups.remove('call-b')).not.toThrow();
		expect(pendingHangups.drainAll()).toEqual(['call-a']);
	});

	it('clear empties the notebook', () => {
		pendingHangups.record('call-a');
		pendingHangups.clear();

		expect(pendingHangups.size).toBe(0);
		expect(pendingHangups.drainAll()).toEqual([]);
	});
});
