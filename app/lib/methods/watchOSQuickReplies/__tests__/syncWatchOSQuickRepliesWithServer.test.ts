import { CURRENT_SERVER, getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import NativeWatchModule from '~/lib/native/NativeWatchModule';
import UserPreferences from '../../userPreferences';
import { shouldShowWatchAppOptions } from '../getWatchStatus';
import { syncWatchOSQuickRepliesWithServer } from '../syncWatchOSQuickRepliesWithServer';

jest.mock('../getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const key = getWatchOSQuickRepliesKey(server);
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('syncWatchOSQuickRepliesWithServer', () => {
	beforeEach(() => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(true);
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
		UserPreferences.setString(CURRENT_SERVER, server);
		UserPreferences.removeItem(key);
	});

	it('seeds replies from the server setting on first login and sends them to the watch', () => {
		expect(syncWatchOSQuickRepliesWithServer(server, 'Yes, No ,,On my way')).toBe(true);
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No', 'On my way']));
		expect(syncQuickReplies).toHaveBeenCalledWith(server, ['Yes', 'No', 'On my way']);
	});

	it('dedupes seeded replies', () => {
		syncWatchOSQuickRepliesWithServer(server, 'Yes,Yes,No');
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No']));
	});

	it('does nothing when no watch app is available', () => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(false);
		expect(syncWatchOSQuickRepliesWithServer(server, 'Yes,No')).toBe(false);
		expect(UserPreferences.contains(key)).toBe(false);
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});

	it('trims replies to the length limit', () => {
		syncWatchOSQuickRepliesWithServer(server, `${'a'.repeat(40)},No`);
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['a'.repeat(30), 'No']));
	});

	it('does not store an empty list, so a later setting can still seed', () => {
		syncWatchOSQuickRepliesWithServer(server, ' , ');
		expect(UserPreferences.contains(key)).toBe(false);
	});

	it('keeps user-edited replies on later logins', () => {
		UserPreferences.setString(key, JSON.stringify(['Mine']));
		syncWatchOSQuickRepliesWithServer(server, 'Yes,No');
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Mine']));
	});

	it('keeps an intentionally emptied list', () => {
		UserPreferences.setString(key, JSON.stringify([]));
		syncWatchOSQuickRepliesWithServer(server, 'Yes,No');
		expect(UserPreferences.getString(key)).toBe('[]');
	});
});
