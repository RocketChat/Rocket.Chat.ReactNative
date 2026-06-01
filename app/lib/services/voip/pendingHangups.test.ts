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

	it('clear empties the notebook', () => {
		pendingHangups.record('call-a');
		pendingHangups.clear();

		expect(pendingHangups.size).toBe(0);
		expect(pendingHangups.drainAll()).toEqual([]);
	});
});
