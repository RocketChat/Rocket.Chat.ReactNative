import NativeWatchModule from '~/lib/native/NativeWatchModule';
import type { TSettingsState } from '~/reducers/settings';
import UserPreferences from '../../userPreferences';
import { syncWatchOSQuickRepliesWithServer } from '../syncWatchOSQuickRepliesWithServer';
import { DEFAULT_QUICK_REPLIES_MAX, DEFAULT_QUICK_REPLY_MAX_LENGTH } from '../constants';

jest.mock('../getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const key = NativeWatchModule!.getQuickRepliesKey(server);
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

const withReplies = (replies: string, limits: TSettingsState = {}): TSettingsState => ({
	Apple_Watch_Quick_Actions: replies,
	...limits
});

describe('syncWatchOSQuickRepliesWithServer', () => {
	beforeEach(() => {
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
		UserPreferences.removeItem(key);
	});

	it('seeds replies from the server setting on first login and sends them to the watch', () => {
		let storedAtSync: string | null | undefined;
		syncQuickReplies.mockImplementationOnce(() => {
			storedAtSync = UserPreferences.getString(key);
			return 'SUCCESS';
		});

		syncWatchOSQuickRepliesWithServer(server, withReplies('Yes, No ,,On my way'));
		expect(syncQuickReplies).toHaveBeenCalledWith(server);
		expect(storedAtSync).toBe(JSON.stringify(['Yes', 'No', 'On my way']));
	});

	it('dedupes seeded replies', () => {
		syncWatchOSQuickRepliesWithServer(server, withReplies('Yes,Yes,No'));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No']));
	});

	it('leaves the list unset but still syncs the watch when the server has no setting', () => {
		syncWatchOSQuickRepliesWithServer(server, {});
		expect(UserPreferences.contains(key)).toBe(false);
		expect(syncQuickReplies).toHaveBeenCalledWith(server);
	});

	it('caps seeded replies at the default max count after deduping when the server sends no limit', () => {
		const replies = Array.from({ length: DEFAULT_QUICK_REPLIES_MAX + 2 }, (_, i) => `Reply ${i}`);
		syncWatchOSQuickRepliesWithServer(server, withReplies([replies[0], ...replies].join(',')));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(replies.slice(0, DEFAULT_QUICK_REPLIES_MAX)));
	});

	it('caps seeded replies at the max count the server sends', () => {
		syncWatchOSQuickRepliesWithServer(server, withReplies('A,B,C,D', { Apple_Watch_Quick_Actions_Max_Count: 2 }));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['A', 'B']));
	});

	it('trims replies to the default length limit when the server sends no limit', () => {
		syncWatchOSQuickRepliesWithServer(server, withReplies(`${'a'.repeat(DEFAULT_QUICK_REPLY_MAX_LENGTH + 10)},No`));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['a'.repeat(DEFAULT_QUICK_REPLY_MAX_LENGTH), 'No']));
	});

	it('trims replies to the length limit the server sends', () => {
		syncWatchOSQuickRepliesWithServer(server, withReplies('abcdefgh,No', { Apple_Watch_Quick_Actions_Max_Length: 5 }));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['abcde', 'No']));
	});

	it('does not end a trimmed reply with a space', () => {
		const keep = DEFAULT_QUICK_REPLY_MAX_LENGTH - 1;
		syncWatchOSQuickRepliesWithServer(server, withReplies(`${'a'.repeat(keep)} bb`));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['a'.repeat(keep)]));
	});

	it('never splits an emoji when trimming', () => {
		const prefix = 'Say';
		const emojiCount = DEFAULT_QUICK_REPLY_MAX_LENGTH - prefix.length;
		syncWatchOSQuickRepliesWithServer(server, withReplies(`${prefix}${'😀'.repeat(emojiCount + 3)}`));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify([`${prefix}${'😀'.repeat(emojiCount)}`]));
	});

	it('does not store an empty list, so a later setting can still seed', () => {
		syncWatchOSQuickRepliesWithServer(server, withReplies(' , '));
		expect(UserPreferences.contains(key)).toBe(false);
	});

	it('keeps user-edited replies on later logins', () => {
		UserPreferences.setString(key, JSON.stringify(['Mine']));
		syncWatchOSQuickRepliesWithServer(server, withReplies('Yes,No'));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Mine']));
	});

	it('keeps an intentionally emptied list', () => {
		UserPreferences.setString(key, JSON.stringify([]));
		syncWatchOSQuickRepliesWithServer(server, withReplies('Yes,No'));
		expect(UserPreferences.getString(key)).toBe('[]');
	});
});
