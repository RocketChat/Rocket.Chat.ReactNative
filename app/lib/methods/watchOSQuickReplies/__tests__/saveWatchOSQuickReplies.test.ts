import NativeWatchModule from '~/lib/native/NativeWatchModule';
import * as NativeWatchModuleModule from '~/lib/native/NativeWatchModule';
import UserPreferences from '../../userPreferences';
import { saveWatchOSQuickReplies } from '../saveWatchOSQuickReplies';

jest.mock('../isWatchAppInstalled', () => ({ isWatchAppInstalled: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const key = NativeWatchModule!.getQuickRepliesKey(server);
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('saveWatchOSQuickReplies', () => {
	let storedAtSync: string | null | undefined;

	beforeEach(() => {
		storedAtSync = undefined;
		syncQuickReplies.mockReset().mockImplementation(() => {
			storedAtSync = UserPreferences.getString(key);
			return null;
		});
		UserPreferences.setString(key, JSON.stringify(['Old']));
	});

	it('stores the replies before syncing the watch', () => {
		saveWatchOSQuickReplies(server, ['Yes', 'No']);

		expect(storedAtSync).toBe(JSON.stringify(['Yes', 'No']));
	});

	it('keeps an empty list stored so the server defaults are not seeded again', () => {
		saveWatchOSQuickReplies(server, []);

		expect(storedAtSync).toBe('[]');
	});

	it('removes the stored replies before syncing the watch when no list is given', () => {
		saveWatchOSQuickReplies(server);

		expect(syncQuickReplies).toHaveBeenCalledWith();
		expect(storedAtSync).toBeNull();
	});

	it('does nothing on a platform without the watch module', () => {
		const replaced = jest.replaceProperty(NativeWatchModuleModule, 'default', null);

		try {
			saveWatchOSQuickReplies(server, ['Yes']);
		} finally {
			replaced.restore();
		}

		expect(UserPreferences.getString(key)).toBe(JSON.stringify(['Old']));
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});
});
