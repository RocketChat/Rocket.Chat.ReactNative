import { roomObservedFields } from '../../definitions/TRoom';

describe('roomObservedFields invariant', () => {
	// useReadOnly / useE2EEStatus derive synchronously from the observed room, so they only stay
	// reactive while these columns are observed. Dropping one of these columns from roomObservedFields
	// silently breaks that reactivity at runtime with no other failing signal — this test is the
	// only guard.
	it.each(['roles', 'encrypted', 'E2EKey'])('keeps %s so read-time derivations stay reactive', key => {
		expect(roomObservedFields).toContain(key);
	});
});
