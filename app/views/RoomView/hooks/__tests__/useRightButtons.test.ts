import { act, renderHook } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { hasPermission } from '../../../../lib/methods/helpers';
import { store as reduxStore } from '../../../../lib/store/auxStore';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useRightButtons } from '../useRightButtons';

// Isolate the permission concern: the observer hooks own their own suites.
jest.mock('../useThreadFollowing', () => ({ useThreadFollowing: () => true }));
jest.mock('../useSubscriptionUnreads', () => ({
	useSubscriptionUnreads: () => ({ tunread: [], tunreadUser: [], tunreadGroup: [], isSelfDm: false, subscription: undefined })
}));

let mockState: any;
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) => selector(mockState)
}));

jest.mock('../../../../lib/database', () => ({ __esModule: true, default: { active: { get: jest.fn() } } }));
jest.mock('../../../../lib/store/auxStore', () => ({ store: { getState: jest.fn() } }));
jest.mock('../../../../lib/database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn() }));
jest.mock('../../../../lib/methods/helpers', () => ({
	...jest.requireActual('../../../../lib/methods/helpers')
}));

const mockGet = database.active.get as jest.Mock;
const mockGetState = reduxStore.getState as jest.Mock;
const mockGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.Mock;

const PERMISSION = 'toggle-room-e2e-encryption';

// Wire redux + WMDB so the sync usePermissions path (useAppSelector + getSubscriptionByRoomId)
// and the old async hasPermission path (reduxStore + database) read identical roles.
const configure = ({ userRoles, subRoles, permissionRoles }: { userRoles: string[]; subRoles: string[]; permissionRoles: string[] }) => {
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

describe('useRightButtons — canToggleEncryption parity', () => {
	beforeEach(() => jest.clearAllMocks());

	const scenarios = [
		{ name: 'user role grants the permission', userRoles: ['admin'], subRoles: [], permissionRoles: ['admin'] },
		{ name: 'subscription role grants the permission', userRoles: [], subRoles: ['owner'], permissionRoles: ['owner'] },
		{ name: 'no matching role denies the permission', userRoles: ['user'], subRoles: ['moderator'], permissionRoles: ['owner'] }
	];

	scenarios.forEach(scenario => {
		it(`matches the old async hasPermission result when ${scenario.name}`, async () => {
			configure(scenario);

			const { result } = renderHook(() => useRightButtons({ rid: 'rid-1', tmid: undefined, userId: 'user-1' }));
			await flush();

			const [expected] = await hasPermission([scenario.permissionRoles], 'rid-1');
			expect(result.current.canToggleEncryption).toBe(expected);
		});
	});
});
