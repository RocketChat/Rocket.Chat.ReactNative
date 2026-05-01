import { createDirectMessageSubscriptionStub } from './createDirectMessageSubscriptionStub';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import database from '../database';
import { store as reduxStore } from '../store/auxStore';
import log from './helpers/log';

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

describe('createDirectMessageSubscriptionStub', () => {
	const RID = 'currentUserIdotherUserId';
	const CURRENT_USER_ID = 'currentUserId';
	const CURRENT_USERNAME = 'me';
	const TARGET_USERNAME = 'alice';

	const buildState = (override?: Partial<{ id: string; username: string }>) => ({
		login: {
			user: {
				id: override?.id ?? CURRENT_USER_ID,
				username: override?.username ?? CURRENT_USERNAME
			}
		}
	});

	let collectionWrites: any[];
	let writeCallback: jest.Mock;
	let createMock: jest.Mock;
	let mockedDb: { write: jest.Mock; get: jest.Mock };

	beforeEach(() => {
		jest.clearAllMocks();

		collectionWrites = [];
		createMock = jest.fn((mutator: (s: any) => void) => {
			const stub: any = { _raw: {} };
			mutator(stub);
			collectionWrites.push(stub);
			return Promise.resolve();
		});
		writeCallback = jest.fn((cb: () => Promise<void>) => cb());
		mockedDb = {
			write: writeCallback,
			get: jest.fn(() => ({ create: createMock }))
		};
		(database as any).active = mockedDb;

		(reduxStore.getState as jest.Mock).mockReturnValue(buildState());
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(null);
	});

	it('inserts a stub when no subscription exists for the rid', async () => {
		await createDirectMessageSubscriptionStub({
			rid: RID,
			username: TARGET_USERNAME,
			fname: 'Alice'
		});

		expect(getSubscriptionByRoomId).toHaveBeenCalledWith(RID);
		expect(writeCallback).toHaveBeenCalledTimes(1);
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(collectionWrites).toHaveLength(1);

		const created = collectionWrites[0];
		expect(created._raw.id).toBe(RID);
		expect(created._raw._id).toBe(RID);
		expect(created.rid).toBe(RID);
		expect(created.t).toBe('d');
		expect(created.name).toBe(TARGET_USERNAME);
		expect(created.fname).toBe('Alice');
		expect(created.uids).toEqual([CURRENT_USER_ID, 'otherUserId']);
		expect(created.usernames).toEqual([CURRENT_USERNAME, TARGET_USERNAME]);
		expect(created.open).toBe(true);
		expect(created.alert).toBe(false);
		expect(created.unread).toBe(0);
		expect(created.userMentions).toBe(0);
		expect(created.groupMentions).toBe(0);
		expect(created.archived).toBe(false);
		expect(created.f).toBe(false);
		expect(created.ro).toBe(false);
		expect(created.ts).toBeInstanceOf(Date);
		expect(created.ls).toBeInstanceOf(Date);
		expect(created.roomUpdatedAt).toBeInstanceOf(Date);
		expect(log).not.toHaveBeenCalled();
	});

	it('falls back to username when fname is missing', async () => {
		await createDirectMessageSubscriptionStub({
			rid: RID,
			username: TARGET_USERNAME
		});

		expect(collectionWrites).toHaveLength(1);
		expect(collectionWrites[0].fname).toBe(TARGET_USERNAME);
	});

	it('is a no-op when a subscription already exists for the rid', async () => {
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue({ id: RID });

		await createDirectMessageSubscriptionStub({
			rid: RID,
			username: TARGET_USERNAME
		});

		expect(getSubscriptionByRoomId).toHaveBeenCalledWith(RID);
		expect(writeCallback).not.toHaveBeenCalled();
		expect(createMock).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('skips when redux login user is missing id', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({ login: { user: { username: CURRENT_USERNAME } } });

		await createDirectMessageSubscriptionStub({
			rid: RID,
			username: TARGET_USERNAME
		});

		expect(writeCallback).not.toHaveBeenCalled();
		expect(createMock).not.toHaveBeenCalled();
	});

	it('skips when redux login user is missing username', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({ login: { user: { id: CURRENT_USER_ID } } });

		await createDirectMessageSubscriptionStub({
			rid: RID,
			username: TARGET_USERNAME
		});

		expect(writeCallback).not.toHaveBeenCalled();
		expect(createMock).not.toHaveBeenCalled();
	});

	it('swallows errors thrown by db.write and logs them', async () => {
		const failure = new Error('write failed');
		writeCallback.mockRejectedValueOnce(failure);

		await expect(
			createDirectMessageSubscriptionStub({
				rid: RID,
				username: TARGET_USERNAME
			})
		).resolves.toBeUndefined();

		expect(log).toHaveBeenCalledWith(failure);
	});

	it('swallows errors thrown by getSubscriptionByRoomId and logs them', async () => {
		const failure = new Error('lookup failed');
		(getSubscriptionByRoomId as jest.Mock).mockRejectedValueOnce(failure);

		await expect(
			createDirectMessageSubscriptionStub({
				rid: RID,
				username: TARGET_USERNAME
			})
		).resolves.toBeUndefined();

		expect(log).toHaveBeenCalledWith(failure);
		expect(writeCallback).not.toHaveBeenCalled();
	});

	it('skips when rid is empty', async () => {
		await createDirectMessageSubscriptionStub({
			rid: '',
			username: TARGET_USERNAME
		});

		expect(getSubscriptionByRoomId).not.toHaveBeenCalled();
		expect(writeCallback).not.toHaveBeenCalled();
	});

	it('skips when username is empty', async () => {
		await createDirectMessageSubscriptionStub({
			rid: RID,
			username: ''
		});

		expect(getSubscriptionByRoomId).not.toHaveBeenCalled();
		expect(writeCallback).not.toHaveBeenCalled();
	});

	it('still writes a stub when the rid does not contain the current user id (fallback uids)', async () => {
		const oddRid = 'unrelatedRoomId';

		await createDirectMessageSubscriptionStub({
			rid: oddRid,
			username: TARGET_USERNAME
		});

		expect(collectionWrites).toHaveLength(1);
		// rid - currentUserId substring removal yields the rid itself when no overlap; we still get a 2-uid array
		expect(collectionWrites[0].uids).toEqual([CURRENT_USER_ID, oddRid]);
	});
});
