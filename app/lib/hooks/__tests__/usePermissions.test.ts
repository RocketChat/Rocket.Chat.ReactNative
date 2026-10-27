import { act, renderHook, waitFor } from '@testing-library/react-native';

import database from '~/lib/database';
import { store as reduxStore } from '~/lib/store/auxStore';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { usePermissions } from '../usePermissions';

let mockState: any;
jest.mock('../useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) => selector(mockState)
}));

jest.mock('~/lib/database', () => ({ __esModule: true, default: { active: { get: jest.fn() } } }));
jest.mock('~/lib/store/auxStore', () => ({ store: { getState: jest.fn() } }));
jest.mock('~/lib/database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn() }));

const mockGet = database.active.get as jest.Mock;
const mockGetState = reduxStore.getState as jest.Mock;
const mockGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.Mock;

const PERMISSION = 'toggle-room-e2e-encryption';

const configureRoles = ({
	userRoles,
	subRoles,
	permissionRoles
}: {
	userRoles: string[];
	subRoles: string[];
	permissionRoles: string[];
}) => {
	mockState = {
		login: { user: { roles: userRoles } },
		permissions: { [PERMISSION]: permissionRoles }
	};
	mockGetState.mockReturnValue({ login: { user: { roles: userRoles } } });

	const subRecord = {
		roles: subRoles,
		observe: () => ({
			subscribe: (cb: (sub: any) => void) => {
				cb({ roles: subRoles });
				return { unsubscribe: jest.fn() };
			}
		})
	};
	mockGetSubscriptionByRoomId.mockResolvedValue(subRecord);
	mockGet.mockImplementation(() => ({ find: jest.fn(() => Promise.resolve(subRecord)) }));
};

const flush = () => act(() => Promise.resolve());

describe('usePermissions', () => {
	beforeEach(() => jest.clearAllMocks());

	const scenarios = [
		{ name: 'user role grants the permission', userRoles: ['admin'], subRoles: [], permissionRoles: ['admin'], expected: true },
		{
			name: 'subscription role grants the permission',
			userRoles: [],
			subRoles: ['owner'],
			permissionRoles: ['owner'],
			expected: true
		},
		{
			name: "the user's roles lack the permission",
			userRoles: ['user'],
			subRoles: ['moderator'],
			permissionRoles: ['owner'],
			expected: false
		}
	];

	scenarios.forEach(scenario => {
		it(`grants ${scenario.expected} when ${scenario.name}`, async () => {
			configureRoles(scenario);

			const { result } = renderHook(() => usePermissions([PERMISSION], 'rid-1'));
			await flush();

			expect(result.current[0]).toBe(scenario.expected);
		});
	});
});

describe('usePermissions when the room changes', () => {
	beforeEach(() => jest.clearAllMocks());

	const renderWithRid = (rid?: string) =>
		renderHook(({ rid: currentRid }: { rid?: string }) => usePermissions([PERMISSION], currentRid), {
			initialProps: { rid }
		});

	it('does not look up a subscription without a room', () => {
		configureRoles({ userRoles: [], subRoles: ['owner'], permissionRoles: ['owner'] });

		renderWithRid(undefined);

		expect(mockGetSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	it("grants from the subscription's roles once the room is known", async () => {
		configureRoles({ userRoles: [], subRoles: ['owner'], permissionRoles: ['owner'] });

		const { result, rerender } = renderWithRid(undefined);
		expect(result.current[0]).toBe(false);

		rerender({ rid: 'rid-1' });

		await waitFor(() => expect(result.current[0]).toBe(true));
		expect(mockGetSubscriptionByRoomId).toHaveBeenCalledWith('rid-1');
	});

	it('drops cached roles when the subscription is gone on a later lookup', async () => {
		configureRoles({ userRoles: [], subRoles: ['owner'], permissionRoles: ['owner'] });
		const { result, rerender } = renderWithRid('rid-1');
		await waitFor(() => expect(result.current[0]).toBe(true));

		mockGetSubscriptionByRoomId.mockReturnValue(new Promise(() => {}));
		rerender({ rid: 'rid-2' });
		mockGetSubscriptionByRoomId.mockResolvedValue(null);
		rerender({ rid: 'rid-1' });
		await flush();

		expect(result.current[0]).toBe(false);
	});
});
