import { act, renderHook } from '@testing-library/react-native';

import database from '../../database';
import { store as reduxStore } from '../../store/auxStore';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { usePermissions } from '../usePermissions';

let mockState: any;
jest.mock('../useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) => selector(mockState)
}));

jest.mock('../../database', () => ({ __esModule: true, default: { active: { get: jest.fn() } } }));
jest.mock('../../store/auxStore', () => ({ store: { getState: jest.fn() } }));
jest.mock('../../database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn() }));

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
			name: 'no matching role denies the permission',
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
