import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system/legacy';

import { ROOMS_SYNC_WAIT_MS, resendFailedUploads } from '../resendFailedUploads';
import { LOGIN, LOGOUT, ROOMS, SERVER } from '~/actions/actionsTypes';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { deferred } from '~/lib/database/__tests__/mockedWatermelonDB';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { getUploadByPath } from '~/lib/database/services/Upload';
import { Encryption } from '~/lib/encryption';
import { UploadNetworkError } from '~/lib/methods/helpers/fileUpload/UploadNetworkError';
import log from '~/lib/methods/helpers/log';
import { sendFileMessage } from '~/lib/methods/sendFileMessage';
import { isUploadActive } from '~/lib/methods/sendFileMessage/utils';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';

const mockFetch = jest.fn();
const mockQuery = jest.fn((..._clauses: unknown[]) => ({ fetch: mockFetch }));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ query: (...clauses: unknown[]) => mockQuery(...clauses) }),
			write: (callback: () => Promise<unknown>) => callback()
		}
	}
}));

jest.mock('~/lib/methods/sendFileMessage', () => ({
	sendFileMessage: jest.fn()
}));

jest.mock('~/lib/methods/sendFileMessage/utils', () => ({
	isUploadActive: jest.fn()
}));

jest.mock('expo-file-system/legacy', () => ({
	getInfoAsync: jest.fn()
}));

jest.mock('~/lib/database/services/Upload', () => ({
	getUploadByPath: jest.fn()
}));

jest.mock('~/lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('~/lib/encryption', () => ({
	Encryption: { getRoomInstance: jest.fn() }
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const SERVER_URL = 'https://uploads.rocket.chat';
const USER = { id: 'userId', token: 'userToken' };

const makeUpload = (id: string, fields: Record<string, unknown> = {}) => {
	const upload: Record<string, any> = {
		id,
		path: `/cache/${id}.jpg`,
		error: true,
		retryOnReconnect: true,
		subscription: { id: 'GENERAL' },
		asPlain: () => ({ id, rid: 'GENERAL', path: `/cache/${id}.jpg`, msg: `caption of ${id}` }),
		...fields
	};
	upload.update = jest.fn((updater: (u: Record<string, any>) => void) => {
		updater(upload);
		return Promise.resolve();
	});
	return upload;
};

const startDrain = () => {
	const { store } = createRecordingStore(resendFailedUploads);
	store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.0.0', name: 'Uploads' }));
	store.dispatch(setUser(USER));
	return store;
};

const syncRooms = async (store: ReturnType<typeof startDrain>) => {
	store.dispatch({ type: ROOMS.SUCCESS });
	await flushSagaMicrotasks();
};

describe('resendFailedUploads', () => {
	let first: Record<string, any>;
	let second: Record<string, any>;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		first = makeUpload('first');
		second = makeUpload('second', { tmid: 'threadId' });
		mockFetch.mockResolvedValue([first, second]);
		jest.mocked(sendFileMessage).mockResolvedValue(undefined);
		jest.mocked(isUploadActive).mockReturnValue(false);
		jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({ exists: true } as any);
		jest.mocked(getUploadByPath).mockImplementation(async id => [first, second].find(upload => upload.id === id) as any);
		jest.mocked(getSubscriptionByRoomId).mockResolvedValue({ encrypted: false } as any);
	});

	afterEach(() => {
		cancelSagaTasks();
		jest.useRealTimers();
	});

	it('reads only the errored uploads marked for a retry, oldest first', async () => {
		await syncRooms(startDrain());

		expect(mockQuery).toHaveBeenCalledWith(Q.where('error', true), Q.where('retry_on_reconnect', true), Q.sortBy('ts', Q.asc));
	});

	it('uploads each file again with its stored details, room, thread, server and user', async () => {
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenNthCalledWith(1, 'GENERAL', first.asPlain(), undefined, SERVER_URL, USER);
		expect(sendFileMessage).toHaveBeenNthCalledWith(2, 'GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	it('starts the next upload only after the previous one finished', async () => {
		const firstUpload = deferred();
		jest.mocked(sendFileMessage).mockImplementationOnce(() => firstUpload.promise);
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(1);

		firstUpload.resolve();
		await flushSagaMicrotasks();

		expect(sendFileMessage).toHaveBeenCalledTimes(2);
	});

	it('starts after a failed rooms sync too', async () => {
		const store = startDrain();
		store.dispatch({ type: ROOMS.FAILURE });
		await flushSagaMicrotasks();

		expect(sendFileMessage).toHaveBeenCalledTimes(2);
	});

	it('waits for the rooms sync, but not longer than the wait limit', async () => {
		startDrain();
		await jest.advanceTimersByTimeAsync(ROOMS_SYNC_WAIT_MS - 1);
		await flushSagaMicrotasks();
		expect(sendFileMessage).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(1);
		await flushSagaMicrotasks();
		expect(sendFileMessage).toHaveBeenCalledTimes(2);
	});

	it('stops at an upload that failed again and is still marked, so later uploads do not overtake it', async () => {
		jest.mocked(sendFileMessage).mockRejectedValueOnce(new UploadNetworkError());
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', first.asPlain(), undefined, SERVER_URL, USER);
	});

	it('carries on past an upload that failed for good', async () => {
		jest.mocked(sendFileMessage).mockImplementationOnce(() => {
			first.retryOnReconnect = false;
			return Promise.reject(new Error('rejected'));
		});
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(2);
	});

	it('skips an upload that is already running instead of starting it twice', async () => {
		jest.mocked(isUploadActive).mockImplementation((path: string) => path === first.path);
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	it('stops retrying an upload whose file is gone and carries on with the next one', async () => {
		jest.mocked(FileSystem.getInfoAsync).mockImplementation(async (path: string) => ({ exists: path !== first.path }) as any);
		await syncRooms(startDrain());

		expect(first.retryOnReconnect).toBe(false);
		expect(first.error).toBe(true);
		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	it('logs an unexpected failure and carries on with the next upload', async () => {
		const error = new Error('cannot read the file');
		jest.mocked(FileSystem.getInfoAsync).mockRejectedValueOnce(error);
		await syncRooms(startDrain());

		expect(log).toHaveBeenCalledWith(error);
		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	it('skips an upload that was deleted while the drain was busy', async () => {
		jest.mocked(getUploadByPath).mockImplementation(async id => (id === first.id ? null : second) as any);
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	it('skips an upload that a manual retry has taken over', async () => {
		jest.mocked(getUploadByPath).mockImplementation(async id => (id === first.id ? { ...first, error: false } : second) as any);
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	it('skips an upload whose retry mark was cleared in the meantime', async () => {
		jest
			.mocked(getUploadByPath)
			.mockImplementation(async id => (id === first.id ? { ...first, retryOnReconnect: false } : second) as any);
		await syncRooms(startDrain());

		expect(sendFileMessage).toHaveBeenCalledTimes(1);
		expect(sendFileMessage).toHaveBeenLastCalledWith('GENERAL', second.asPlain(), 'threadId', SERVER_URL, USER);
	});

	describe('uploads to an encrypted room', () => {
		beforeEach(() => {
			jest.mocked(getSubscriptionByRoomId).mockResolvedValue({ encrypted: true } as any);
		});

		it('uploads once the room has its session key', async () => {
			jest.mocked(Encryption.getRoomInstance).mockResolvedValue({ hasSessionKey: () => true } as any);
			await syncRooms(startDrain());

			expect(sendFileMessage).toHaveBeenCalledTimes(2);
		});

		it.each([
			['the room has no session key yet', { hasSessionKey: () => false }],
			['the room cannot be set up for encryption', null]
		])('keeps every upload marked and sends nothing while %s', async (_, roomE2E) => {
			jest.mocked(Encryption.getRoomInstance).mockResolvedValue(roomE2E as any);
			await syncRooms(startDrain());

			expect(sendFileMessage).not.toHaveBeenCalled();
			expect(first.retryOnReconnect).toBe(true);
			expect(second.retryOnReconnect).toBe(true);
		});
	});

	it.each([
		['a logout', LOGOUT],
		['a workspace switch', SERVER.SELECT_REQUEST],
		['the next login', LOGIN.SUCCESS]
	])('stops uploading on %s', async (_, type) => {
		const firstUpload = deferred();
		jest.mocked(sendFileMessage).mockImplementationOnce(() => firstUpload.promise);
		const store = startDrain();
		await syncRooms(store);
		expect(sendFileMessage).toHaveBeenCalledTimes(1);

		store.dispatch({ type });
		firstUpload.resolve();
		await flushSagaMicrotasks();

		expect(sendFileMessage).toHaveBeenCalledTimes(1);
	});

	it('does not start when a stop action comes before the rooms sync ends', async () => {
		const store = startDrain();
		store.dispatch({ type: LOGOUT });
		await jest.advanceTimersByTimeAsync(ROOMS_SYNC_WAIT_MS);
		await flushSagaMicrotasks();

		expect(sendFileMessage).not.toHaveBeenCalled();
	});

	it('logs and ends when the uploads cannot be read', async () => {
		const error = new Error('read failed');
		mockFetch.mockRejectedValue(error);
		await syncRooms(startDrain());

		expect(log).toHaveBeenCalledWith(error);
		expect(sendFileMessage).not.toHaveBeenCalled();
	});
});
