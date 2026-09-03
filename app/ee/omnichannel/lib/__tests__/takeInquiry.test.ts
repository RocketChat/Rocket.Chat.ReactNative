import sdk from '../../../../lib/services/sdk';
import { store as reduxStore } from '../../../../lib/store/auxStore';
import { takeInquiry } from '..';

jest.mock('../../../../lib/services/sdk', () => ({
	__esModule: true,
	default: { post: jest.fn(() => Promise.resolve()), get: jest.fn(), methodCallWrapper: jest.fn(() => Promise.resolve()) }
}));
jest.mock('../../../../lib/store/auxStore', () => ({ store: { getState: jest.fn() } }));
jest.mock('../subscriptions/inquiry', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/events', () => ({
	__esModule: true,
	default: { addEventListener: jest.fn(), removeListener: jest.fn() }
}));

const mockGetState = reduxStore.getState as jest.Mock;

describe('takeInquiry', () => {
	beforeEach(() => jest.clearAllMocks());

	it('uses the REST endpoint on a modern Workspace', async () => {
		mockGetState.mockReturnValue({ server: { version: '7.11.0' } });

		await takeInquiry('inquiry-1');

		expect(sdk.post).toHaveBeenCalledWith('livechat/inquiries.take', { inquiryId: 'inquiry-1' });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('falls back to the DDP method on an older Workspace', async () => {
		mockGetState.mockReturnValue({ server: { version: '7.10.0' } });

		await takeInquiry('inquiry-1');

		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('livechat:takeInquiry', 'inquiry-1');
		expect(sdk.post).not.toHaveBeenCalled();
	});
});
