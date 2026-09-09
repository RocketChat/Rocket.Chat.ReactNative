import { renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type RoomStore } from '../../definitions';
import { useCloseBanner } from '../useCloseBanner';

const mockWrite = jest.fn((fn: () => Promise<void>) => fn());
jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { write: (fn: () => Promise<void>) => mockWrite(fn) } }
}));

const makeRoomStore = (room: unknown): RoomStore => createStore(() => ({ room })) as RoomStore;

describe('useCloseBanner', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('writes bannerClosed = true when the room is a database model', async () => {
		const update = jest.fn(async (mutator: (r: { bannerClosed: boolean }) => void) => {
			const draft = { bannerClosed: false };
			mutator(draft);
			return draft;
		});
		const roomStore = makeRoomStore({ id: 'room-1', update });
		const { result } = renderHook(() => useCloseBanner(roomStore));

		await result.current();

		expect(mockWrite).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalledTimes(1);
	});

	it('is a no-op for a room without a database identity', async () => {
		const roomStore = makeRoomStore({ rid: 'rid-1', t: 'c' });
		const { result } = renderHook(() => useCloseBanner(roomStore));

		await result.current();

		expect(mockWrite).not.toHaveBeenCalled();
	});

	it('swallows write errors', async () => {
		mockWrite.mockRejectedValueOnce(new Error('boom'));
		const roomStore = makeRoomStore({ id: 'room-1', update: jest.fn() });
		const { result } = renderHook(() => useCloseBanner(roomStore));

		await expect(result.current()).resolves.toBeUndefined();
	});
});
