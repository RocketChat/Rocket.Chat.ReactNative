import { renderHook } from '@testing-library/react-native';

import I18n from '../../../i18n';
import { logEvent } from '../../../lib/methods/helpers/log';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import { isInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';
import { callJitsi } from '../../../lib/methods/callJitsi';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { sendLoadingEvent } from '../../../containers/Loading';
import { useJumpToMessage } from './useJumpToMessage';
import { useRoomNavigation, type IUseRoomNavigationParams } from './useRoomNavigation';

jest.mock('./useJumpToMessage', () => ({
	useJumpToMessage: jest.fn(() => ({
		jumpToMessage: jest.fn(),
		cancelJumpToMessage: jest.fn(),
		consumeJumpParam: jest.fn(),
		onThreadMessagesLoaded: jest.fn()
	}))
}));
jest.mock('../../../lib/methods/helpers/room', () => ({ makeThreadName: jest.fn(() => 'Thread Name') }));
jest.mock('../../../lib/methods/helpers', () => ({ useDebounce: (fn: (...args: any[]) => any) => fn }));
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
jest.mock('../../../lib/methods/getRoomInfo', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve({ rid: 'other-rid' }))
}));
jest.mock('../../../lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('../../../lib/services/voip/isInActiveVoipCall', () => ({ isInActiveVoipCall: jest.fn(() => false) }));
jest.mock('../../../lib/methods/callJitsi', () => ({ callJitsi: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../../containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));

const mockLogEvent = logEvent as jest.Mock;
const mockMakeThreadName = makeThreadName as jest.Mock;
const mockGetThreadById = getThreadById as jest.Mock;
const mockGetThreadName = getThreadName as jest.Mock;
const mockGetRoomInfo = getRoomInfo as jest.Mock;
const mockGoRoom = goRoom as jest.Mock;
const mockIsInActiveVoipCall = isInActiveVoipCall as jest.Mock;
const mockCallJitsi = callJitsi as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;
const mockUseJumpToMessage = useJumpToMessage as jest.Mock;

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

	it('navToRoom fetches the target room info and opens it, forwarding the jump target', async () => {
		mockGetRoomInfo.mockResolvedValueOnce({ rid: 'other-rid' });
		const { result } = renderRoomNavigation();

		await result.current.navToRoom({ id: 'msg-1', rid: 'other-rid' } as any);

		expect(mockGetRoomInfo).toHaveBeenCalledWith('other-rid');
		expect(mockGoRoom).toHaveBeenCalledWith({ item: { rid: 'other-rid' }, isMasterDetail: false, jumpToMessageId: 'msg-1' });
	});

	it('navToRoom is a no-op without a target rid', async () => {
		const { result } = renderRoomNavigation();

		await result.current.navToRoom({ id: 'msg-1' } as any);

		expect(mockGetRoomInfo).not.toHaveBeenCalled();
	});

	it('onDiscussionPress fetches the discussion room info and opens it', async () => {
		mockGetRoomInfo.mockResolvedValueOnce({ rid: 'discussion-1' });
		const { result } = renderRoomNavigation({ isMasterDetail: true });

		await result.current.onDiscussionPress('discussion-1');

		expect(mockGetRoomInfo).toHaveBeenCalledWith('discussion-1');
		expect(mockGoRoom).toHaveBeenCalledWith({ item: { rid: 'discussion-1' }, isMasterDetail: true });
	});

	it('onDiscussionPress is a no-op without a drid', async () => {
		const { result } = renderRoomNavigation();

		await result.current.onDiscussionPress(undefined);

		expect(mockGetRoomInfo).not.toHaveBeenCalled();
	});

	it('onEncryptedPress navigates to the E2E screen outside master-detail', () => {
		const { result, navigation } = renderRoomNavigation({ isMasterDetail: false });

		result.current.onEncryptedPress();

		expect(navigation.navigate).toHaveBeenCalledWith('E2ESaveYourPasswordStackNavigator', {
			screen: 'E2EHowItWorksView',
			params: { showCloseModal: true }
		});
	});

	it('onEncryptedPress routes through ModalStackNavigator on master-detail', () => {
		const { result, navigation } = renderRoomNavigation({ isMasterDetail: true });

		result.current.onEncryptedPress();

		expect(navigation.navigate).toHaveBeenCalledWith('ModalStackNavigator', {
			screen: 'E2EHowItWorksView',
			params: { showCloseModal: true }
		});
	});

	it('jumpToMessageByUrl parses the message id from the url and triggers the jump', async () => {
		const { result } = renderRoomNavigation();
		const { jumpToMessage } = mockUseJumpToMessage.mock.results[0].value;

		await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-42', true);

		expect(jumpToMessage).toHaveBeenCalledWith('msg-42', true);
	});

	it('jumpToMessageByUrl is a no-op without a url', async () => {
		const { result } = renderRoomNavigation();
		const { jumpToMessage } = mockUseJumpToMessage.mock.results[0].value;

		await result.current.jumpToMessageByUrl(undefined);

		expect(jumpToMessage).not.toHaveBeenCalled();
	});

	it('handleEnterCall does nothing when there is an active VoIP call', () => {
		mockIsInActiveVoipCall.mockReturnValueOnce(true);
		const roomRef = { current: { id: 'room-id-1', rid: 'rid-1', t: 'c' } };
		const { result } = renderRoomNavigation({ roomRef: roomRef as any });

		result.current.handleEnterCall();

		expect(mockCallJitsi).not.toHaveBeenCalled();
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('handleEnterCall does nothing when the current room has no id', () => {
		const { result } = renderRoomNavigation({ roomRef: { current: { rid: 'rid-1', t: 'c' } } as any });

		result.current.handleEnterCall();

		expect(mockCallJitsi).not.toHaveBeenCalled();
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('handleEnterCall starts Jitsi when the room has no expired call timeout', () => {
		const roomRef = { current: { id: 'room-id-1', rid: 'rid-1', t: 'c' } };
		const { result } = renderRoomNavigation({ roomRef: roomRef as any });

		result.current.handleEnterCall();

		expect(mockCallJitsi).toHaveBeenCalledWith({ room: roomRef.current });
	});

	it('handleEnterCall shows an error alert when the Jitsi call already ended', () => {
		const roomRef = { current: { id: 'room-id-1', rid: 'rid-1', t: 'c', jitsiTimeout: new Date(Date.now() - 1000) } };
		const { result } = renderRoomNavigation({ roomRef: roomRef as any });

		result.current.handleEnterCall();

		expect(mockShowErrorAlert).toHaveBeenCalledWith(I18n.t('Call_already_ended'));
		expect(mockCallJitsi).not.toHaveBeenCalled();
	});

	// consumeJumpParam/onThreadMessagesLoaded now live in useJumpToMessage (see useJumpToMessage.test.tsx
	// for their real behavior) — here we only assert useRoomNavigation forwards that hook's result.
	it('consumeJumpParam is forwarded from useJumpToMessage', () => {
		const { result } = renderRoomNavigation();
		const { consumeJumpParam } = mockUseJumpToMessage.mock.results[0].value;

		expect(result.current.consumeJumpParam).toBe(consumeJumpParam);
	});

	it('onThreadMessagesLoaded is forwarded from useJumpToMessage', () => {
		const { result } = renderRoomNavigation();
		const { onThreadMessagesLoaded } = mockUseJumpToMessage.mock.results[0].value;

		expect(result.current.onThreadMessagesLoaded).toBe(onThreadMessagesLoaded);
	});
});
