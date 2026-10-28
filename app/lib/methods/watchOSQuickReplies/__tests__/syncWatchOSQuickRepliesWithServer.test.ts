import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import NativeWatchModule from '~/lib/native/NativeWatchModule';
import UserPreferences from '../../userPreferences';
import { shouldShowWatchAppOptions } from '../getWatchStatus';
import { syncWatchOSQuickRepliesWithServer } from '../syncWatchOSQuickRepliesWithServer';
import { QUICK_REPLIES_MAX } from '../constants';

jest.mock('../getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const key = getWatchOSQuickRepliesKey(server);
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('syncWatchOSQuickRepliesWithServer', () => {
	beforeEach(() => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(true);
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
		UserPreferences.removeItem(key);
	});

	it('seeds replies from the server setting on first login and sends them to the watch', () => {
		let storedAtSync: string | null | undefined;
		syncQuickReplies.mockImplementationOnce(() => {
			storedAtSync = UserPreferences.getString(key);
			return 'SUCCESS';
		});

		syncWatchOSQuickRepliesWithServer(server, 'Yes, No ,,On my way');
		expect(syncQuickReplies).toHaveBeenCalledWith(server);
		expect(storedAtSync).toBe(JSON.stringify(['Yes', 'No', 'On my way']));
	});

	it('dedupes seeded replies', () => {
		syncWatchOSQuickRepliesWithServer(server, 'Yes,Yes,No');
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No']));
	});

	it('leaves the list unset but still syncs the watch when the server has no setting', () => {
		syncWatchOSQuickRepliesWithServer(server, undefined);
		expect(UserPreferences.contains(key)).toBe(false);
		expect(syncQuickReplies).toHaveBeenCalledWith(server);
	});

	it('caps seeded replies at the max count after deduping', () => {
		const replies = Array.from({ length: QUICK_REPLIES_MAX + 2 }, (_, i) => `Reply ${i}`);
		syncWatchOSQuickRepliesWithServer(server, [replies[0], ...replies].join(','));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(replies.slice(0, QUICK_REPLIES_MAX)));
	});

	it('does nothing when no watch app is available', () => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(false);
		syncWatchOSQuickRepliesWithServer(server, 'Yes,No');
		expect(UserPreferences.contains(key)).toBe(false);
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});

	it('trims replies to the length limit', () => {
		syncWatchOSQuickRepliesWithServer(server, `${'a'.repeat(40)},No`);
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['a'.repeat(30), 'No']));
	});

	it('never splits an emoji when trimming', () => {
		syncWatchOSQuickRepliesWithServer(server, `Say${'😀'.repeat(30)}`);
		expect(UserPreferences.getString(key)).toBe(JSON.stringify([`Say${'😀'.repeat(27)}`]));
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
