import { renderHook } from '@testing-library/react-native';

import { type IRoomViewState } from '../../definitions';
import { useCloseBanner } from '../useCloseBanner';

const mockWrite = jest.fn((fn: () => Promise<void>) => fn());
jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { write: (fn: () => Promise<void>) => mockWrite(fn) } }
}));

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
