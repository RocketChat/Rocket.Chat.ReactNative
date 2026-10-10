import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { e2eRequestSubscriptionKeys } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(true),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('e2eRequestSubscriptionKeys', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.6.0');
	});

	it('uses DDP below 8.6.0', async () => {
		setServerVersion('8.5.9');
		await e2eRequestSubscriptionKeys();
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('e2e.requestSubscriptionKeys');
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('posts e2e.requestSubscriptionKeys on 8.6.0+', async () => {
		await e2eRequestSubscriptionKeys();
		expect(sdk.post).toHaveBeenCalledWith('e2e.requestSubscriptionKeys');
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});
