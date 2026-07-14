import { renderHook } from '@testing-library/react-native';

import { useGoRoomActionsView } from './useGoRoomActionsView';

const mockNavigate = jest.fn();
const mockPush = jest.fn();
let mockRouteParams: Record<string, unknown> = { t: 'l' };
let mockIsMasterDetail = false;

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: mockNavigate, push: mockPush }),
	useRoute: () => ({ params: mockRouteParams })
}));
jest.mock('../../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => mockIsMasterDetail
}));
jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	events: { ROOM_GO_RA: 'ROOM_GO_RA' },
	logEvent: jest.fn()
}));

const mockState = {
	room: { rid: 'rid-1', t: 'l' },
	member: { _id: 'm1' },
	joined: true,
	canForwardGuest: true,
	canReturnQueue: true,
	canViewCannedResponse: true,
	canPlaceLivechatOnHold: true
};

jest.mock('../stores/RoomStore', () => ({
	useRoomStoreByRid: (_rid: string | undefined, selector: (state: typeof mockState) => unknown) => selector(mockState)
}));

describe('useGoRoomActionsView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRouteParams = { t: 'l' };
		mockIsMasterDetail = false;
	});

	it('pushes RoomActionsView with omnichannel permissions outside master-detail', () => {
		const { result } = renderHook(() => useGoRoomActionsView('rid-1'));

		result.current();

		expect(mockPush).toHaveBeenCalledWith('RoomActionsView', {
			rid: 'rid-1',
			t: 'l',
			room: { rid: 'rid-1', t: 'l' },
			member: { _id: 'm1' },
			joined: true,
			omnichannelPermissions: {
				canForwardGuest: true,
				canReturnQueue: true,
				canViewCannedResponse: true,
				canPlaceLivechatOnHold: true
			}
		});
	});

	it('navigates through ModalStackNavigator on master-detail', () => {
		mockIsMasterDetail = true;
		const { result } = renderHook(() => useGoRoomActionsView('rid-1'));

		result.current();

		expect(mockNavigate).toHaveBeenCalledWith('ModalStackNavigator', expect.objectContaining({ screen: 'RoomActionsView' }));
	});
});
