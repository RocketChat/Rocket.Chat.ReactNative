import NativeWatchModule from '~/lib/native/NativeWatchModule';
import { shouldShowWatchAppOptions } from '../getWatchStatus';
import { syncWatchOSQuickReplies } from '../syncReplies';

jest.mock('../getWatchStatus', () => ({ shouldShowWatchAppOptions: jest.fn(() => true) }));

const server = 'https://open.rocket.chat';
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('syncWatchOSQuickReplies', () => {
	beforeEach(() => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(true);
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
	});

	it('asks the watch module to sync the given server', () => {
		expect(syncWatchOSQuickReplies(server)).toBe(true);
		expect(syncQuickReplies).toHaveBeenCalledWith(server);
	});

	it('does nothing when no watch app is available', () => {
		(shouldShowWatchAppOptions as jest.Mock).mockReturnValue(false);
		expect(syncWatchOSQuickReplies(server)).toBe(false);
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});

	it('reports native errors as failures', () => {
		syncQuickReplies.mockReturnValue('[ERROR]: Watch session not activated');
		expect(syncWatchOSQuickReplies(server)).toBe(false);
	});
});
