import { Q } from '@nozbe/watermelondb';

import { RESEND_INTERVAL_MS, ROOMS_SYNC_WAIT_MS, resendFailedMessages } from '../resendFailedMessages';
import { LOGIN, LOGOUT, ROOMS, SERVER } from '~/actions/actionsTypes';
import { messagesStatus } from '~/lib/constants/messagesStatus';
import { deferred } from '~/lib/database/__tests__/mockedWatermelonDB';
import log from '~/lib/methods/helpers/log';
import { resendMessage } from '~/lib/methods/sendMessage';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';

const mockFetch = jest.fn();
const mockQuery = jest.fn((..._clauses: unknown[]) => ({ fetch: mockFetch }));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ query: (...clauses: unknown[]) => mockQuery(...clauses) })
		}
	}
}));

jest.mock('~/lib/methods/sendMessage', () => ({
	resendMessage: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const first = { id: 'first' };
const second = { id: 'second', tmid: 'threadId' };

const advance = async (ms: number) => {
	await jest.advanceTimersByTimeAsync(ms);
	await flushSagaMicrotasks();
};

const startDrain = () => {
	const { store } = createRecordingStore(resendFailedMessages);
	return store;
};

describe('resendFailedMessages', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockFetch.mockResolvedValue([first, second]);
	});

	afterEach(() => {
		cancelSagaTasks();
		jest.useRealTimers();
	});

	it('reads only the errored messages marked for a retry, oldest first', async () => {
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();

		expect(mockQuery).toHaveBeenCalledWith(
			Q.where('status', messagesStatus.ERROR),
			Q.where('retry_on_reconnect', true),
			Q.sortBy('ts', Q.asc)
		);
	});

	it('waits for a resend to finish, then pauses, before the next message, keeping the thread id', async () => {
		const firstResend = deferred();
		jest.mocked(resendMessage).mockImplementationOnce(() => firstResend.promise);
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();

		expect(resendMessage).toHaveBeenCalledTimes(1);
		expect(resendMessage).toHaveBeenLastCalledWith(first, undefined);

		await advance(RESEND_INTERVAL_MS * 4);
		expect(resendMessage).toHaveBeenCalledTimes(1);

		firstResend.resolve();
		await advance(RESEND_INTERVAL_MS - 1);
		expect(resendMessage).toHaveBeenCalledTimes(1);

		await advance(1);
		expect(resendMessage).toHaveBeenCalledTimes(2);
		expect(resendMessage).toHaveBeenLastCalledWith(second, 'threadId');
	});

	it('stops at a message that is still waiting for a retry, so later messages do not overtake it', async () => {
		jest.mocked(resendMessage).mockImplementationOnce(async message => {
			Object.assign(message, { status: messagesStatus.ERROR, retryOnReconnect: true });
		});
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();

		await advance(RESEND_INTERVAL_MS * 4);

		expect(resendMessage).toHaveBeenCalledTimes(1);
		expect(resendMessage).toHaveBeenLastCalledWith(first, undefined);
	});

	it('carries on past a message the server rejected for good', async () => {
		jest.mocked(resendMessage).mockImplementationOnce(async message => {
			Object.assign(message, { status: messagesStatus.ERROR, retryOnReconnect: false });
		});
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();

		await advance(RESEND_INTERVAL_MS);

		expect(resendMessage).toHaveBeenCalledTimes(2);
		expect(resendMessage).toHaveBeenLastCalledWith(second, 'threadId');
	});

	it('logs a failed resend and carries on with the next message', async () => {
		const error = new Error('resend failed');
		jest.mocked(resendMessage).mockRejectedValueOnce(error);
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();

		expect(log).toHaveBeenCalledWith(error);

		await advance(RESEND_INTERVAL_MS);
		expect(resendMessage).toHaveBeenCalledTimes(2);
		expect(resendMessage).toHaveBeenLastCalledWith(second, 'threadId');
	});

	it('starts after a failed rooms sync too', async () => {
		const store = startDrain();
		store.dispatch({ type: ROOMS.FAILURE });
		await flushSagaMicrotasks();

		expect(resendMessage).toHaveBeenCalledWith(first, undefined);
	});

	it('waits for the rooms sync, but not longer than the wait limit', async () => {
		startDrain();
		await advance(ROOMS_SYNC_WAIT_MS - 1);
		expect(resendMessage).not.toHaveBeenCalled();

		await advance(1);
		expect(resendMessage).toHaveBeenCalledWith(first, undefined);
	});

	it.each([
		['a logout', LOGOUT],
		['a workspace switch', SERVER.SELECT_REQUEST],
		['the next login', LOGIN.SUCCESS]
	])('stops resending on %s', async (_, type) => {
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();
		expect(resendMessage).toHaveBeenCalledTimes(1);

		store.dispatch({ type });
		await advance(RESEND_INTERVAL_MS);

		expect(resendMessage).toHaveBeenCalledTimes(1);
	});

	it('does not start when a stop action comes before the rooms sync ends', async () => {
		const store = startDrain();
		store.dispatch({ type: LOGOUT });
		await advance(ROOMS_SYNC_WAIT_MS);

		expect(resendMessage).not.toHaveBeenCalled();
	});

	it('logs and ends when the messages cannot be read', async () => {
		const error = new Error('read failed');
		mockFetch.mockRejectedValue(error);
		const store = startDrain();
		store.dispatch({ type: ROOMS.SUCCESS });
		await flushSagaMicrotasks();

		expect(log).toHaveBeenCalledWith(error);
		expect(resendMessage).not.toHaveBeenCalled();
	});
});
