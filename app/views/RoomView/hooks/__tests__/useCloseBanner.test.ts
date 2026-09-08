import { act, renderHook } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';

import { type IRoomViewState } from '../../definitions';
import { useCloseBanner } from '../useCloseBanner';
import { createRoomStore, observeRoom } from '../../stores/RoomStore';
import { RoomStoreContext, useRoom } from '../../stores/RoomStoreContext';

let insideWrite = false;
const mockWrite = jest.fn(async (fn: () => Promise<void>) => {
	insideWrite = true;
	try {
		return await fn();
	} finally {
		insideWrite = false;
	}
});
const mockGet = jest.fn();
jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: (...args: unknown[]) => mockGet(...args), write: (fn: () => Promise<void>) => mockWrite(fn) } }
}));
jest.mock('../../../../lib/methods/readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn() }));
jest.mock('../../services/getMessages', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/services/restApi', () => ({ getUserInfo: jest.fn() }));
jest.mock('../../../../lib/methods/helpers', () => ({
	isGroupChat: jest.fn(() => false),
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../../lib/methods/isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../services/joinRoom', () => ({ joinRoom: jest.fn(), resumeRoom: jest.fn() }));

describe('useCloseBanner', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		insideWrite = false;
	});

	it('routes a current observed Room read to the original model after mutation and replacement', async () => {
		let emit: (rows: IRoomViewState['room'][]) => void = () => {};
		mockGet.mockReturnValue({
			query: () => ({
				observeWithColumns: () => ({
					subscribe: (callback: (rows: IRoomViewState['room'][]) => void) => {
						emit = callback;
						return { unsubscribe: jest.fn() };
					}
				})
			})
		});

		const createRoom = () => {
			let model!: {
				id: string;
				rid: string;
				t: string;
				bannerClosed: boolean;
				_topic: string;
				readonly topic: string;
				update: jest.Mock;
			};
			model = {
				id: 'room-1',
				rid: 'rid-1',
				t: 'c',
				bannerClosed: false,
				_topic: 'old',
				get topic() {
					expect(this).toBe(model);
					return this._topic;
				},
				update: jest.fn(async function (this: typeof model, mutator: (room: typeof model) => void) {
					expect(insideWrite).toBe(true);
					expect(this).toBe(model);
					mutator(this);
				})
			};
			return model;
		};
		const original = createRoom();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: { rid: 'rid-1', t: 'c' } });
		const cleanup = observeRoom('rid-1', store);
		emit([original]);

		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(RoomStoreContext.Provider, { value: store }, children);
		const { result } = renderHook(() => useCloseBanner(useRoom()), { wrapper });

		original._topic = 'new';
		act(() => emit([original]));
		await result.current();

		const replacement = createRoom();
		act(() => emit([replacement]));
		await result.current();

		expect(mockWrite).toHaveBeenCalledTimes(2);
		expect(original.update).toHaveBeenCalledTimes(1);
		expect(original.bannerClosed).toBe(true);
		expect(replacement.update).toHaveBeenCalledTimes(1);
		expect(replacement.bannerClosed).toBe(true);
		cleanup();
	});

	it('writes bannerClosed = true when the room is a database model', async () => {
		const update = jest.fn(async (mutator: (r: { bannerClosed: boolean }) => void) => {
			const draft = { bannerClosed: false };
			mutator(draft);
			return draft;
		});
		const room = { id: 'room-1', update } as unknown as IRoomViewState['room'];
		const { result } = renderHook(() => useCloseBanner(room));

		await result.current();

		expect(mockWrite).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalledTimes(1);
	});

	it('is a no-op for a room without a database identity', async () => {
		const room = { rid: 'rid-1', t: 'c' } as IRoomViewState['room'];
		const { result } = renderHook(() => useCloseBanner(room));

		await result.current();

		expect(mockWrite).not.toHaveBeenCalled();
	});

	it('swallows write errors', async () => {
		mockWrite.mockRejectedValueOnce(new Error('boom'));
		const room = { id: 'room-1', update: jest.fn() } as unknown as IRoomViewState['room'];
		const { result } = renderHook(() => useCloseBanner(room));

		await expect(result.current()).resolves.toBeUndefined();
	});
});
