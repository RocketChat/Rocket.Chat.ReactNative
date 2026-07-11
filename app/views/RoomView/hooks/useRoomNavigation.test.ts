import { renderHook } from '@testing-library/react-native';

import { logEvent } from '../../../lib/methods/helpers/log';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import { sendLoadingEvent } from '../../../containers/Loading';
import { useRoomNavigation, type IUseRoomNavigationParams } from './useRoomNavigation';

jest.mock('./useJumpToMessage', () => ({
	useJumpToMessage: jest.fn(() => ({ jumpToMessage: jest.fn(), cancelJumpToMessage: jest.fn() }))
}));
jest.mock('../../../lib/methods/helpers/room', () => ({ makeThreadName: jest.fn(() => 'Thread Name') }));
jest.mock('../../../lib/methods/helpers', () => ({ debounce: (fn: (...args: any[]) => any) => fn }));
jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../lib/database/services/Thread', () => ({ getThreadById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../../lib/methods/getThreadName', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve('Thread Title'))
}));
jest.mock('../../../containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));

const mockLogEvent = logEvent as jest.Mock;
const mockMakeThreadName = makeThreadName as jest.Mock;
const mockGetThreadById = getThreadById as jest.Mock;
const mockGetThreadName = getThreadName as jest.Mock;

const renderRoomNavigation = (overrides: Partial<IUseRoomNavigationParams> = {}) => {
	const navigation = { navigate: jest.fn(), push: jest.fn(), setParams: jest.fn(), addListener: jest.fn() };
	const { result } = renderHook(() =>
		useRoomNavigation({
			rid: 'rid-1',
			tmid: undefined,
			t: 'c',
			navigation: navigation as any,
			isMasterDetail: false,
			listRef: { current: null },
			member: {},
			joined: true,
			canForwardGuest: false,
			canReturnQueue: false,
			canViewCannedResponse: false,
			canPlaceLivechatOnHold: false,
			roomRef: { current: { rid: 'rid-1', t: 'c' } },
			roomUserIdRef: { current: null },
			cancelJumpToMessageRef: { current: jest.fn() },
			pendingJumpRef: { current: undefined },
			...overrides
		})
	);

	return { result, navigation };
};

describe('useRoomNavigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('navToRoomInfo navigates directly to RoomInfoView and logs the room-info event for a channel', () => {
		const { result, navigation } = renderRoomNavigation({ t: 'c' });

		result.current.navToRoomInfo({ t: 'c' });

		expect(mockLogEvent).toHaveBeenCalledWith(expect.anything());
		expect(navigation.navigate).toHaveBeenCalledWith('RoomInfoView', expect.objectContaining({ t: 'c', fromRid: 'rid-1' }));
	});

	it('navToRoomInfo logs the user-info event for a direct message', () => {
		const { result } = renderRoomNavigation({ t: 'd' });

		result.current.navToRoomInfo({ t: 'd' });

		const { events } = jest.requireActual('../../../lib/methods/helpers/log');
		expect(mockLogEvent).toHaveBeenCalledWith(events.ROOM_GO_USER_INFO);
	});

	it('navToRoomInfo routes through ModalStackNavigator with showCloseModal on master-detail', () => {
		const { result, navigation } = renderRoomNavigation({ isMasterDetail: true, t: 'c' });

		result.current.navToRoomInfo({ t: 'c' });

		expect(navigation.navigate).toHaveBeenCalledWith(
			'ModalStackNavigator',
			expect.objectContaining({
				screen: 'RoomInfoView',
				params: expect.objectContaining({ t: 'c', fromRid: 'rid-1', showCloseModal: true })
			})
		);
	});

	it('navToThread resolves and pushes a thread name for an item carrying its own tmid', async () => {
		mockGetThreadById.mockResolvedValueOnce(null);
		mockGetThreadName.mockResolvedValueOnce('Resolved Thread');
		const { result, navigation } = renderRoomNavigation();

		await result.current.navToThread({ id: 'msg-1', tmid: 'thread-1', tmsg: '' } as any);

		expect(sendLoadingEvent).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'thread-1',
			name: 'Resolved Thread',
			t: 'thread',
			roomUserId: null,
			jumpToMessageId: 'msg-1'
		});
	});

	it('navToThread pushes using makeThreadName when opening a thread from its parent message', async () => {
		const { result, navigation } = renderRoomNavigation();

		await result.current.navToThread({ id: 'msg-1', tlm: '2024-01-01T00:00:00.000Z' } as any);

		expect(mockMakeThreadName).toHaveBeenCalled();
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'msg-1',
			name: 'Thread Name',
			t: 'thread',
			roomUserId: null
		});
	});

	it('goRoomActionsView pushes RoomActionsView with omnichannel permissions outside master-detail', () => {
		const { result, navigation } = renderRoomNavigation({
			t: 'l',
			canForwardGuest: true,
			canReturnQueue: true,
			canViewCannedResponse: true,
			canPlaceLivechatOnHold: true
		});

		result.current.goRoomActionsView();

		expect(navigation.push).toHaveBeenCalledWith('RoomActionsView', {
			rid: 'rid-1',
			t: 'l',
			room: { rid: 'rid-1', t: 'c' },
			member: {},
			joined: true,
			omnichannelPermissions: {
				canForwardGuest: true,
				canReturnQueue: true,
				canViewCannedResponse: true,
				canPlaceLivechatOnHold: true
			}
		});
	});

	it('goRoomActionsView navigates through ModalStackNavigator on master-detail', () => {
		const { result, navigation } = renderRoomNavigation({ isMasterDetail: true });

		result.current.goRoomActionsView();

		expect(navigation.navigate).toHaveBeenCalledWith(
			'ModalStackNavigator',
			expect.objectContaining({ screen: 'RoomActionsView' })
		);
	});
});
