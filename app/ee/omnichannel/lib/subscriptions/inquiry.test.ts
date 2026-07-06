/* eslint-disable import/first */
jest.mock('../../../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		onStreamData: jest.fn(),
		subscribe: jest.fn()
	}
}));

jest.mock('../../../../lib/store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			login: { user: { id: 'agent-1', roles: ['livechat-agent'] } },
			inquiry: { queued: [] }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../../../../lib/services/restApi', () => ({
	getAgentDepartments: jest.fn()
}));

jest.mock('../../../../lib/methods/helpers', () => ({
	hasRole: jest.fn()
}));

jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

import subscribeInquiry from './inquiry';
import sdk from '../../../../lib/services/sdk';
import { store } from '../../../../lib/store/auxStore';
import { getAgentDepartments } from '../../../../lib/services/restApi';
import { hasRole } from '../../../../lib/methods/helpers';
import { inquiryQueueAdd, inquiryQueueRemove, inquiryQueueUpdate } from '../../actions/inquiry';

const flushPromises = () => new Promise<void>(resolve => setImmediate(resolve));

describe('subscribeInquiry', () => {
	let queueHandler: (msg: any) => void;
	const streamStop = jest.fn();
	const deptStop = jest.fn();

	beforeEach(() => {
		streamStop.mockReset();
		deptStop.mockReset();
		(sdk.onStreamData as jest.Mock).mockReset().mockImplementation((_name: string, handler: (m: any) => void) => {
			queueHandler = handler;
			return Promise.resolve({ stop: streamStop });
		});
		(sdk.subscribe as jest.Mock).mockReset().mockReturnValue({ stop: deptStop });
		(getAgentDepartments as jest.Mock).mockReset().mockResolvedValue({ success: true, departments: [] });
		(hasRole as jest.Mock).mockReset().mockReturnValue(false);
		(store.getState as jest.Mock).mockReturnValue({
			login: { user: { id: 'agent-1' } },
			inquiry: { queued: [] }
		});
		(store.dispatch as jest.Mock).mockReset();
	});

	it('Fix 4 regression: does NOT subscribe to a "connected" collection (was a broken DDP listener)', () => {
		subscribeInquiry();
		const subscribed = (sdk.onStreamData as jest.Mock).mock.calls.map(([name]) => name);
		expect(subscribed).not.toContain('connected');
	});

	it('subscribes only to stream-livechat-inquiry-queue-observer via onStreamData', () => {
		subscribeInquiry();
		expect(sdk.onStreamData).toHaveBeenCalledTimes(1);
		expect(sdk.onStreamData).toHaveBeenCalledWith('stream-livechat-inquiry-queue-observer', expect.any(Function));
	});

	it('subscribes to the public queue when the agent has no departments', async () => {
		(getAgentDepartments as jest.Mock).mockResolvedValue({ success: true, departments: [] });
		subscribeInquiry();
		await flushPromises();
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-livechat-inquiry-queue-observer', 'public');
	});

	it('subscribes to the public queue when the user is a livechat-manager (even with departments)', async () => {
		(getAgentDepartments as jest.Mock).mockResolvedValue({ success: true, departments: [{ departmentId: 'd1' }] });
		(hasRole as jest.Mock).mockImplementation((role: string) => role === 'livechat-manager');
		subscribeInquiry();
		await flushPromises();
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-livechat-inquiry-queue-observer', 'public');
	});

	it('subscribes to each department channel for the agent', async () => {
		(getAgentDepartments as jest.Mock).mockResolvedValue({
			success: true,
			departments: [{ departmentId: 'd1' }, { departmentId: 'd2' }]
		});
		subscribeInquiry();
		await flushPromises();
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-livechat-inquiry-queue-observer', 'department/d1');
		expect(sdk.subscribe).toHaveBeenCalledWith('stream-livechat-inquiry-queue-observer', 'department/d2');
	});

	it('returns a stop function that unsubscribes stream + department listeners', async () => {
		(getAgentDepartments as jest.Mock).mockResolvedValue({
			success: true,
			departments: [{ departmentId: 'd1' }]
		});
		const result = subscribeInquiry() as { stop: () => void };
		await flushPromises();
		result.stop();
		await flushPromises();
		expect(streamStop).toHaveBeenCalled();
		expect(deptStop).toHaveBeenCalled();
	});

	it('does not create department subscriptions when stop() is called before getAgentDepartments resolves', async () => {
		let resolveDepts: (v: any) => void;
		(getAgentDepartments as jest.Mock).mockReturnValue(
			new Promise(resolve => {
				resolveDepts = resolve;
			})
		);
		const result = subscribeInquiry() as { stop: () => void };
		result.stop();
		resolveDepts!({ success: true, departments: [{ departmentId: 'd1' }] });
		await flushPromises();
		// `sdk.subscribe` should never be invoked after stop()
		expect(sdk.subscribe).not.toHaveBeenCalled();
	});

	it('rejects when the logged-in user has no id', async () => {
		(store.getState as jest.Mock).mockReturnValue({
			login: { user: {} },
			inquiry: { queued: [] }
		});
		await expect(subscribeInquiry() as any).rejects.toThrow('inquiry: @subscribeInquiry user.id not found');
	});

	it('queue handler dispatches inquiryQueueAdd for new queued items', () => {
		subscribeInquiry();
		queueHandler({
			fields: { args: [{ type: 'inserted', _id: 'inq-1', status: 'queued', rid: 'r1' }] }
		});
		expect(store.dispatch).toHaveBeenCalledWith(inquiryQueueAdd({ _id: 'inq-1', status: 'queued', rid: 'r1' } as any));
	});

	it('queue handler dispatches inquiryQueueUpdate for items already on the queue', () => {
		(store.getState as jest.Mock).mockReturnValue({
			login: { user: { id: 'agent-1' } },
			inquiry: { queued: [{ _id: 'inq-1' }] }
		});
		subscribeInquiry();
		queueHandler({
			fields: { args: [{ type: 'changed', _id: 'inq-1', status: 'queued', rid: 'r1' }] }
		});
		expect(store.dispatch).toHaveBeenCalledWith(inquiryQueueUpdate({ _id: 'inq-1', status: 'queued', rid: 'r1' } as any));
	});

	it('queue handler dispatches inquiryQueueRemove when an item leaves the queue', () => {
		subscribeInquiry();
		queueHandler({
			fields: { args: [{ type: 'changed', _id: 'inq-1', status: 'taken', rid: 'r1' }] }
		});
		expect(store.dispatch).toHaveBeenCalledWith(inquiryQueueRemove('inq-1'));
	});

	it('queue handler ignores "added" events (deduplicated by "changed")', () => {
		subscribeInquiry();
		queueHandler({
			fields: { args: [{ type: 'added', _id: 'inq-1', status: 'queued', rid: 'r1' }] }
		});
		expect(store.dispatch).not.toHaveBeenCalled();
	});
});
