import { getHiddenSystemMessages } from './getHiddenSystemMessages';

describe('getHiddenSystemMessages', () => {
	it('combines the workspace and room lists', () => {
		expect(getHiddenSystemMessages(['ul'], ['uj'])).toEqual(['uj', 'ul']);
	});

	it('removes duplicates', () => {
		expect(getHiddenSystemMessages(['uj', 'ul'], ['uj'])).toEqual(['uj', 'ul']);
	});

	it('uses the workspace list when the room list is not an array', () => {
		expect(getHiddenSystemMessages(true, ['uj'])).toEqual(['uj']);
		expect(getHiddenSystemMessages(undefined, ['uj'])).toEqual(['uj']);
	});

	it('uses the room list when the workspace list is not an array', () => {
		expect(getHiddenSystemMessages(['ul'], undefined)).toEqual(['ul']);
	});

	it('returns an empty list when neither is an array', () => {
		expect(getHiddenSystemMessages(undefined, undefined)).toEqual([]);
	});
});
