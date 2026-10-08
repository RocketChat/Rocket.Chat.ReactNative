import NativeWatchModule from '~/lib/native/NativeWatchModule';
import { CURRENT_SERVER, WATCHOS_QUICKREPLIES } from '~/lib/constants/keys';
import UserPreferences from '../userPreferences';
import { syncWatchOSQuickReplies } from './syncReplies';

jest.mock('./getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('syncWatchOSQuickReplies', () => {
	beforeEach(() => {
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
		UserPreferences.setString(CURRENT_SERVER, server);
		UserPreferences.removeItem(`${server}-${WATCHOS_QUICKREPLIES}`);
	});

	it('sends the current server replies to the watch', () => {
		UserPreferences.setString(`${server}-${WATCHOS_QUICKREPLIES}`, JSON.stringify(['Yes', 'No']));
		expect(syncWatchOSQuickReplies()).toBe(true);
		expect(syncQuickReplies).toHaveBeenCalledWith(server, ['Yes', 'No']);
	});

	it('sends an empty list when there are no replies', () => {
		syncWatchOSQuickReplies();
		expect(syncQuickReplies).toHaveBeenCalledWith(server, []);
	});

	it('reports native errors as failures', () => {
		syncQuickReplies.mockReturnValue('[ERROR]: Watch session not activated');
		expect(syncWatchOSQuickReplies()).toBe(false);
	});
});
