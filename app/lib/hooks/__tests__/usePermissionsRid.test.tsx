import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePermissions } from '../usePermissions';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';

const mockGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.Mock;

const mockState = {
	login: { user: { roles: ['user'] } },
	permissions: {
		'create-c': ['admin'],
		'edit-room': ['room-role']
	}
};

jest.mock('../useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => any) => selector(mockState)
}));

jest.mock('~/lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

const makeSub = (roles: string[]) => ({
	observe: () => ({
		subscribe: (cb: (s: any) => void) => {
			cb({ roles });
			return { unsubscribe: jest.fn() };
		}
	})
});

describe('usePermissions — useSubscriptionRoles rid dependency', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not query a subscription while rid is undefined', () => {
		renderHook(() => usePermissions(['create-c'], undefined));
		expect(mockGetSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	it('re-subscribes when rid changes from undefined to a real rid', async () => {
		mockGetSubscriptionByRoomId.mockResolvedValue(makeSub([]));

		const { rerender } = renderHook(({ rid }: { rid?: string }) => usePermissions(['create-c'], rid), {
			initialProps: { rid: undefined as string | undefined }
		});

		expect(mockGetSubscriptionByRoomId).not.toHaveBeenCalled();

		await act(async () => {
			rerender({ rid: 'room-late' });
			await Promise.resolve();
		});

		await waitFor(() => expect(mockGetSubscriptionByRoomId).toHaveBeenCalledWith('room-late'));
	});

	it('grants permission when a room role from the late-arriving rid matches', async () => {
		mockGetSubscriptionByRoomId.mockResolvedValue(makeSub(['room-role']));

		const { result, rerender } = renderHook(({ rid }: { rid?: string }) => usePermissions(['edit-room'], rid), {
			initialProps: { rid: undefined as string | undefined }
		});

		expect(result.current).toEqual([false]);

		await act(async () => {
			rerender({ rid: 'room-late' });
			await Promise.resolve();
		});

		await waitFor(() => expect(result.current).toEqual([true]));
	});
});
