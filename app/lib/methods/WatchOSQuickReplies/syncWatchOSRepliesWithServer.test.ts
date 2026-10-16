import { type IApplicationState } from '~/definitions';
import { WATCHOS_QUICKREPLIES } from '~/lib/constants/keys';
import UserPreferences from '../userPreferences';
import syncWatchOSQuickRepliesWithServer from './syncWatchOSRepliesWithServer';

jest.mock('./getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));
jest.mock('./syncReplies', () => ({ syncWatchOSQuickReplies: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const key = `${server}-${WATCHOS_QUICKREPLIES}`;
const stateWith = (setting?: string) =>
	({ server: { server }, settings: { Apple_Watch_Quick_Actions: setting } }) as unknown as IApplicationState;

describe('syncWatchOSQuickRepliesWithServer', () => {
	beforeEach(() => UserPreferences.removeItem(key));

	it('seeds replies from the server setting on first login', () => {
		syncWatchOSQuickRepliesWithServer(stateWith('Yes, No ,,On my way'));
		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Yes', 'No', 'On my way']));
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
