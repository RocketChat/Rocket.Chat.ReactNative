import NativeWatchModule from '~/lib/native/NativeWatchModule';
import log from '../../helpers/log';
import { isWatchAppInstalled } from '../isWatchAppInstalled';
import { syncWatchOSQuickReplies } from '../syncWatchOSQuickReplies';

jest.mock('../isWatchAppInstalled', () => ({ isWatchAppInstalled: jest.fn(() => true) }));
jest.mock('../../helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('syncWatchOSQuickReplies', () => {
	beforeEach(() => {
		(isWatchAppInstalled as jest.Mock).mockReturnValue(true);
		syncQuickReplies.mockReset().mockReturnValue(null);
		jest.mocked(log).mockClear();
	});

	it('asks the watch module to sync', () => {
		syncWatchOSQuickReplies();
		expect(syncQuickReplies).toHaveBeenCalledWith();
		expect(log).not.toHaveBeenCalled();
	});

	it('does nothing when no watch app is available', () => {
		(isWatchAppInstalled as jest.Mock).mockReturnValue(false);
		syncWatchOSQuickReplies();
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});

	it('logs the error the watch module returns', () => {
		syncQuickReplies.mockReturnValue('Watch session not activated');
		syncWatchOSQuickReplies();
		expect(log).toHaveBeenCalledWith(new Error('Watch session not activated'));
	});
});
