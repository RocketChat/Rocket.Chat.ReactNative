import { act, renderHook } from '@testing-library/react-native';

import database from '../../database';
import { hasPermission } from '../../methods/helpers';
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

const configureIdenticalRolesForBothPaths = ({
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

describe('usePermissions: hasPermission parity', () => {
	beforeEach(() => jest.clearAllMocks());

	const scenarios = [
		{ name: 'user role grants the permission', userRoles: ['admin'], subRoles: [], permissionRoles: ['admin'] },
		{ name: 'subscription role grants the permission', userRoles: [], subRoles: ['owner'], permissionRoles: ['owner'] },
		{ name: 'no matching role denies the permission', userRoles: ['user'], subRoles: ['moderator'], permissionRoles: ['owner'] }
	];

	scenarios.forEach(scenario => {
		it(`matches the old async hasPermission result when ${scenario.name}`, async () => {
			configureIdenticalRolesForBothPaths(scenario);

			const { result } = renderHook(() => usePermissions([PERMISSION], 'rid-1'));
			await flush();

			const [expected] = await hasPermission([scenario.permissionRoles], 'rid-1');
			expect(result.current[0]).toBe(expected);
		});
	});
});
