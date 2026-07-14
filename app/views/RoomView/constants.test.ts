import { roomAttrsUpdate } from './constants';

describe('roomAttrsUpdate invariant', () => {
	// useReadOnly / useE2EEStatus derive synchronously from the observed room, so they only stay
	// reactive while these columns are observed. See docs/ARCHITECTURE.md.
	it.each(['roles', 'encrypted', 'E2EKey'])('keeps %s so read-time derivations stay reactive', key => {
		expect(roomAttrsUpdate).toContain(key);
	});
});
