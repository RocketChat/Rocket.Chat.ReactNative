import { roomObservedFields } from '../TRoom';

describe('roomObservedFields invariant', () => {
	it.each(['roles', 'encrypted', 'E2EKey'])('keeps %s so read-time derivations stay reactive', key => {
		expect(roomObservedFields).toContain(key);
	});
});
