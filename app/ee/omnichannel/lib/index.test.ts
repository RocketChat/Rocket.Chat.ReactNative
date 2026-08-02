/* eslint-disable import/first */
jest.mock('../../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		methodCallWrapper: jest.fn(),
		onStreamData: jest.fn(),
		subscribe: jest.fn()
	}
}));

jest.mock('../../../lib/store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			settings: {},
			login: { user: { id: 'u1', token: 't1' } },
			server: { version: '8.0.0' },
			inquiry: { queued: [] }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../../../lib/methods/helpers', () => ({
	compareServerVersion: jest.fn(),
	hasRole: jest.fn(() => false)
}));

jest.mock('../../../lib/methods/helpers/events', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(),
		removeListener: jest.fn(),
		emit: jest.fn()
	}
}));

jest.mock('./subscriptions/inquiry', () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue({ stop: jest.fn() })
}));

jest.mock('../../../lib/services/restApi', () => ({
	getAgentDepartments: jest.fn().mockResolvedValue({ success: true, departments: [] })
}));

jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

import sdk from '../../../lib/services/sdk';
import { store } from '../../../lib/store/auxStore';
import { compareServerVersion } from '../../../lib/methods/helpers';
import EventEmitter from '../../../lib/methods/helpers/events';
import subscribeInquiry from './subscriptions/inquiry';

const mockSdkPost = sdk.post as jest.Mock;
const mockMethodCallWrapper = sdk.methodCallWrapper as jest.Mock;
const mockCompareServerVersion = compareServerVersion as jest.Mock;
const mockAddEventListener = EventEmitter.addEventListener as jest.Mock;
const mockSubscribeInquiry = subscribeInquiry as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	mockSdkPost.mockResolvedValue({ success: true });
	mockMethodCallWrapper.mockResolvedValue(undefined);
});

// We need to import after the mocks are set up, and re-require each test
// to avoid module-level side effects interfering between tests.
// The Omnichannel class constructor runs on module load, so we isolate with jest.isolateModules.

describe('changeLivechatStatus', () => {
	it('uses REST POST for server >= 8.0.0', async () => {
		mockCompareServerVersion.mockReturnValue(true);
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '8.0.0' } });

		let changeLivechatStatus: () => any;
		jest.isolateModules(() => {
			({ changeLivechatStatus } = require('./index'));
		});

		await changeLivechatStatus!();

		expect(mockSdkPost).toHaveBeenCalledWith('/v1/livechat/agent.status');
		expect(mockMethodCallWrapper).not.toHaveBeenCalled();
	});

	it('uses methodCallWrapper for server < 8.0.0', async () => {
		mockCompareServerVersion.mockReturnValue(false);
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.9.0' } });

		let changeLivechatStatus: () => any;
		jest.isolateModules(() => {
			({ changeLivechatStatus } = require('./index'));
		});

		await changeLivechatStatus!();

		expect(mockMethodCallWrapper).toHaveBeenCalledWith('livechat:changeLivechatStatus');
		expect(mockSdkPost).not.toHaveBeenCalled();
	});
});

describe('takeInquiry', () => {
	it('uses REST POST for server >= 7.11.0', async () => {
		mockCompareServerVersion.mockReturnValue(true);

		let takeInquiry: (inquiryId: string, serverVersion: string) => any;
		jest.isolateModules(() => {
			({ takeInquiry } = require('./index'));
		});

		await takeInquiry!('inq1', '7.11.0');

		expect(mockSdkPost).toHaveBeenCalledWith('/v1/livechat/inquiries.take', { inquiryId: 'inq1' });
		expect(mockMethodCallWrapper).not.toHaveBeenCalled();
	});

	it('uses methodCallWrapper for server < 7.11.0', async () => {
		mockCompareServerVersion.mockReturnValue(false);

		let takeInquiry: (inquiryId: string, serverVersion: string) => any;
		jest.isolateModules(() => {
			({ takeInquiry } = require('./index'));
		});

		await takeInquiry!('inq1', '7.10.0');

		expect(mockMethodCallWrapper).toHaveBeenCalledWith('livechat:takeInquiry', 'inq1');
		expect(mockSdkPost).not.toHaveBeenCalled();
	});
});

describe('isOmnichannelStatusAvailable', () => {
	it('returns true when statusLivechat is "available"', () => {
		let isOmnichannelStatusAvailable: (status: string | undefined) => boolean;
		jest.isolateModules(() => {
			({ isOmnichannelStatusAvailable } = require('./index'));
		});

		expect(isOmnichannelStatusAvailable!('available')).toBe(true);
	});

	it('returns false when statusLivechat is not "available"', () => {
		let isOmnichannelStatusAvailable: (status: string | undefined) => boolean;
		jest.isolateModules(() => {
			({ isOmnichannelStatusAvailable } = require('./index'));
		});

		expect(isOmnichannelStatusAvailable!('not-available')).toBe(false);
		expect(isOmnichannelStatusAvailable!(undefined)).toBe(false);
	});
});

describe('Omnichannel.subscribeInquiry', () => {
	it('subscribes a fresh inquiry on each INQUIRY_SUBSCRIBE event', async () => {
		const firstStop = jest.fn();
		const secondStop = jest.fn();
		mockSubscribeInquiry.mockResolvedValueOnce({ stop: firstStop }).mockResolvedValueOnce({ stop: secondStop });

		jest.isolateModules(() => {
			require('./index');
		});

		const subscribeListener = mockAddEventListener.mock.calls.find(([event]) => event === 'INQUIRY_SUBSCRIBE')?.[1];
		expect(subscribeListener).toBeDefined();

		subscribeListener();
		await Promise.resolve();
		await Promise.resolve();

		subscribeListener();
		await Promise.resolve();
		await Promise.resolve();

		expect(mockSubscribeInquiry).toHaveBeenCalledTimes(2);
		expect(firstStop).not.toHaveBeenCalled();
		expect(secondStop).not.toHaveBeenCalled();
	});
});
