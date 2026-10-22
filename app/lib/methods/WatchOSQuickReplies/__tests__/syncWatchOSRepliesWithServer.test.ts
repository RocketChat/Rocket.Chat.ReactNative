import { type IApplicationState } from '~/definitions';
import { CURRENT_SERVER, getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import NativeWatchModule from '~/lib/native/NativeWatchModule';
import UserPreferences from '../../userPreferences';
import { shouldShowWatchAppOptions } from '../getWatchStatus';
import syncWatchOSQuickRepliesWithServer from '../syncWatchOSRepliesWithServer';

jest.mock('../getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const key = getWatchOSQuickRepliesKey(server);
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;
const stateWith = (setting?: string) =>
	({ server: { server }, settings: { Apple_Watch_Quick_Actions: setting } }) as unknown as IApplicationState;

describe('syncWatchOSQuickRepliesWithServer', () => {
	beforeEach(() => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(true);
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
		UserPreferences.setString(CURRENT_SERVER, server);
		UserPreferences.removeItem(key);
	});

	it('seeds replies from the server setting on first login and sends them to the watch', () => {
		expect(syncWatchOSQuickRepliesWithServer(stateWith('Yes, No ,,On my way'))).toBe(true);
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No', 'On my way']));
		expect(syncQuickReplies).toHaveBeenCalledWith(server, ['Yes', 'No', 'On my way']);
	});

	it('dedupes seeded replies', () => {
		syncWatchOSQuickRepliesWithServer(stateWith('Yes,Yes,No'));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No']));
	});

	it('does nothing when no watch app is available', () => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(false);
		expect(syncWatchOSQuickRepliesWithServer(stateWith('Yes,No'))).toBe(false);
		expect(UserPreferences.contains(key)).toBe(false);
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});

	it('keeps user-edited replies on later logins', () => {
		UserPreferences.setString(key, JSON.stringify(['Mine']));
		syncWatchOSQuickRepliesWithServer(stateWith('Yes,No'));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Mine']));
	});

	it('keeps an intentionally emptied list', () => {
		UserPreferences.setString(key, JSON.stringify([]));
		syncWatchOSQuickRepliesWithServer(stateWith('Yes,No'));
		expect(UserPreferences.getString(key)).toBe('[]');
	});
});
