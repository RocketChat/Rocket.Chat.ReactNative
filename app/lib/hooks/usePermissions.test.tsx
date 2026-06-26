import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePermissions } from './usePermissions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

const mockGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.Mock;

// Drive Redux-derived values (user roles + permission roles) deterministically.
const mockState = {
	login: { user: { roles: ['user'] } },
	permissions: {
		'create-c': ['admin'],
		'edit-room': ['room-role']
	}
};

jest.mock('./useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => any) => selector(mockState)
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

// A subscription stub whose observe() emits the given roles synchronously.
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
		// 'edit-room' is granted to role 'room-role', which the user only has via the room subscription.
		mockGetSubscriptionByRoomId.mockResolvedValue(makeSub(['room-role']));

		const { result, rerender } = renderHook(({ rid }: { rid?: string }) => usePermissions(['edit-room'], rid), {
			initialProps: { rid: undefined as string | undefined }
		});

		// No rid yet => user roles only => not granted.
		expect(result.current).toEqual([false]);

		await act(async () => {
			rerender({ rid: 'room-late' });
			await Promise.resolve();
		});

		await waitFor(() => expect(result.current).toEqual([true]));
	});
});
