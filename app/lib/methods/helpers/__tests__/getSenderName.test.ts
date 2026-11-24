import { getSenderName } from '../getSenderName';

const mockSettings = { UI_Use_Real_Name: true };

jest.mock('~/lib/store/auxStore', () => ({ store: { getState: () => ({ settings: mockSettings }) } }));

describe('getSenderName', () => {
	it('returns the name when the workspace shows real names', () => {
		mockSettings.UI_Use_Real_Name = true;

		expect(getSenderName({ username: 'jane.doe', name: 'Jane Doe' })).toBe('Jane Doe');
	});

	it('falls back to the username when the sender has no name', () => {
		mockSettings.UI_Use_Real_Name = true;

		expect(getSenderName({ username: 'jane.doe' })).toBe('jane.doe');
	});

	it('returns the username when the workspace shows usernames', () => {
		mockSettings.UI_Use_Real_Name = false;

		expect(getSenderName({ username: 'jane.doe', name: 'Jane Doe' })).toBe('jane.doe');
	});
});
