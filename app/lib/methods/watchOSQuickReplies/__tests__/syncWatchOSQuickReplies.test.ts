import NativeWatchModule from '~/lib/native/NativeWatchModule';
import log from '../../helpers/log';
import { isWatchAppInstalled } from '../isWatchAppInstalled';
import { syncWatchOSQuickReplies } from '../syncWatchOSQuickReplies';

jest.mock('../isWatchAppInstalled', () => ({ isWatchAppInstalled: jest.fn(() => true) }));
jest.mock('../../helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const server = 'https://open.rocket.chat';
const syncQuickReplies = NativeWatchModule!.syncQuickReplies as jest.Mock;

describe('syncWatchOSQuickReplies', () => {
	beforeEach(() => {
		(isWatchAppInstalled as jest.Mock).mockReturnValue(true);
		syncQuickReplies.mockReset().mockReturnValue('SUCCESS');
		jest.mocked(log).mockClear();
	});

	it('asks the watch module to sync the given server', () => {
		syncWatchOSQuickReplies(server);
		expect(syncQuickReplies).toHaveBeenCalledWith(server);
		expect(log).not.toHaveBeenCalled();
	});

	it('does nothing when no watch app is available', () => {
		(isWatchAppInstalled as jest.Mock).mockReturnValue(false);
		syncWatchOSQuickReplies(server);
		expect(syncQuickReplies).not.toHaveBeenCalled();
	});

	it('reports native errors as failures', () => {
		syncQuickReplies.mockReturnValue('[ERROR]: Watch session not activated');
		syncWatchOSQuickReplies(server);
		expect(log).toHaveBeenCalledWith(new Error('[ERROR]: Watch session not activated'));
	});
});
