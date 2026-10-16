import { renderHook } from '@testing-library/react-native';

import { type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { showConfirmationAlert } from '~/lib/methods/helpers';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { returnLivechat } from '~/lib/services/restApi';
import { type RoomStore } from '~/views/RoomView/definitions';
import { closeLivechat } from '~/views/RoomView/services/closeLivechat';
import { placeLivechatOnHold } from '~/views/RoomView/services/placeLivechatOnHold';
import { useOmnichannelActions, useRoomActions, useRoomHeaderMode, useThreadActions } from '../useRoomHeaderActions';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));

let mockIsMasterDetail = false;
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => mockIsMasterDetail }));

let mockLivechatRequestComment = false;
jest.mock('~/lib/hooks/useSetting', () => ({ useSetting: () => mockLivechatRequestComment }));

let mockUserId = 'user-1';
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => mockUserId }));
jest.mock('~/theme', () => ({ useTheme: () => ({ theme: 'light', colors: { buttonBackgroundDangerDefault: '#f00' } }) }));
jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	logEvent: jest.fn()
}));

jest.mock('~/lib/methods/helpers', () => ({
	...jest.requireActual('~/lib/methods/helpers'),
	showConfirmationAlert: jest.fn(),
	showErrorAlert: jest.fn()
}));

let mockRoomState: Record<string, unknown>;
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: Record<string, unknown>) => unknown) => selector(mockRoomState)
}));
jest.mock('zustand/react/shallow', () => ({ useShallow: (selector: unknown) => selector }));

let mockCanReturnQueue = false;
let mockCanPlaceLivechatOnHold = false;
jest.mock('~/ee/omnichannel/hooks/useCanReturnQueue', () => ({ useCanReturnQueue: () => mockCanReturnQueue }));
jest.mock('../useCanPlaceLivechatOnHold', () => ({ useCanPlaceLivechatOnHold: () => mockCanPlaceLivechatOnHold }));

let mockFollowersByThread: Record<string, string[]> = {};
jest.mock('../useThreadFollowing', () => ({
	useThreadFollowing: (tmid: string, userId: string) => mockFollowersByThread[tmid]?.includes(userId) ?? false
}));
jest.mock('~/lib/methods/toggleFollowThread', () => ({ toggleFollowThread: jest.fn() }));
jest.mock('~/views/RoomView/services/closeLivechat', () => ({ closeLivechat: jest.fn() }));
jest.mock('~/views/RoomView/services/placeLivechatOnHold', () => ({ placeLivechatOnHold: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ returnLivechat: jest.fn() }));

const mockGoThreadsView = jest.fn();
const mockGoSearchView = jest.fn();
let mockButtonsData: Record<string, unknown>;
jest.mock('../useRoomActionsState', () => ({
	useRoomActionsState: () => mockButtonsData
}));

const mockVideoConf = { showInitCallActionSheet: jest.fn(), callEnabled: false, disabledTooltip: false };
jest.mock('~/lib/hooks/useVideoConf', () => ({ useVideoConf: () => mockVideoConf }));

const mockMediaCall = {
	openNewMediaCall: jest.fn(),
	hasMediaCallPermission: false,
	isInActiveCall: false
};
jest.mock('~/lib/hooks/useNewMediaCall', () => ({ useNewMediaCall: () => mockMediaCall }));

const roomStore = {} as RoomStore;

const renderRoomActions = () => renderHook(() => useRoomActions('rid-1', roomStore)).result.current;
const renderThreadActions = (tmid: string) => renderHook(() => useThreadActions(tmid)).result.current;
const renderOmnichannelActions = () => renderHook(() => useOmnichannelActions('rid-1', roomStore)).result.current;

const labelsOf = (actions: { label: string }[]) => actions.map(action => action.label);

const moreMenuOf = (actions: IHeaderAction[]) => {
	const more = actions[actions.length - 1];
	expect(more.label).toBe('More');
	expect(more.icon).toBe('kebab');
	return more.menu ?? [];
};

const actionByTestID = (actions: IHeaderAction[], testID: string) => actions.find(action => action.testID === testID);
const menuItemByTestID = (testID: string) => moreMenuOf(renderRoomActions()).find(item => item.testID === testID);

describe('useRoomHeaderActions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsMasterDetail = false;
		mockLivechatRequestComment = false;
		mockUserId = 'user-1';
		mockCanReturnQueue = false;
		mockCanPlaceLivechatOnHold = false;
		mockFollowersByThread = {};
		mockRoomState = {
			room: { id: 'sub-1', t: 'c', departmentId: 'department-1' },
			membership: 'subscribed',
			canForwardGuest: false
		};
		mockButtonsData = {
			threadsEnabled: false,
			issuesWithNotifications: false,
			disableNotifications: false,
			hasE2EEWarning: false,
			canToggleEncryption: false,
			isSelfDm: false,
			tunread: [],
			tunreadUser: [],
			tunreadGroup: [],
			threadsAccessibilityLabel: 'Threads',
			callAccessibilityLabel: 'Call',
			goThreadsView: mockGoThreadsView,
			goSearchView: mockGoSearchView,
			goE2EEToggleRoomView: jest.fn(),
			navigateToNotificationOrPushTroubleshoot: jest.fn()
		};
		mockVideoConf.callEnabled = false;
		mockVideoConf.disabledTooltip = false;
		mockMediaCall.hasMediaCallPermission = false;
		mockMediaCall.isInActiveCall = false;
	});

	it.each([
		['none for an invited room', undefined, { room: { t: 'c' }, membership: 'invited' }, 'none'],
		[
			'none for a queued omnichannel room',
			undefined,
			{ room: { id: 'sub-1', t: 'l', status: 'queued' }, membership: 'subscribed' },
			'none'
		],
		['none for an omnichannel room in preview', undefined, { room: { t: 'l' }, membership: 'preview' }, 'none'],
		[
			'omnichannel for an active omnichannel room, even inside a thread',
			'tmid-1',
			{ room: { id: 'sub-1', t: 'l' }, membership: 'subscribed' },
			'omnichannel'
		],
		['thread when a tmid is given', 'tmid-1', { room: { t: 'c' }, membership: 'subscribed' }, 'thread'],
		['room for a regular channel', undefined, { room: { t: 'c' }, membership: 'subscribed' }, 'room']
	])('picks the %s', (_case, tmid, state, mode) => {
		mockRoomState = { ...state, canForwardGuest: false };

		const { result } = renderHook(() => useRoomHeaderMode(tmid, roomStore));

		expect(result.current).toBe(mode);
	});

	describe('room', () => {
		it('shows only the more menu, holding search, when nothing else is present', () => {
			const actions = renderRoomActions();
			const menu = moreMenuOf(actions);

			expect(labelsOf(actions)).toEqual(['More']);
			expect(labelsOf(menu)).toEqual(['Search messages']);
			menu[0].onPress();
			expect(mockGoSearchView).toHaveBeenCalled();
		});

		it('keeps threads in the bar and moves every other action into the more menu', () => {
			mockButtonsData = {
				...mockButtonsData,
				threadsEnabled: true,
				hasE2EEWarning: true,
				canToggleEncryption: true,
				issuesWithNotifications: true
			};
			mockMediaCall.hasMediaCallPermission = true;

			const actions = renderRoomActions();

			expect(actions.map(action => action.testID)).toEqual(['room-view-header-threads', 'room-view-header-kebab']);
			expect(moreMenuOf(actions).map(item => item.testID)).toEqual([
				'room-view-header-call',
				'room-view-header-encryption',
				'room-view-push-troubleshoot',
				'room-view-search'
			]);
		});

		it('offers encryption while the other actions are disabled by the e2ee warning', () => {
			mockButtonsData = { ...mockButtonsData, threadsEnabled: true, hasE2EEWarning: true, canToggleEncryption: true };

			const actions = renderRoomActions();

			expect(menuItemByTestID('room-view-header-encryption')?.disabled).toBe(false);
			expect(actionByTestID(actions, 'room-view-header-threads')?.disabled).toBe(true);
			expect(menuItemByTestID('room-view-search')?.disabled).toBe(true);
		});

		it('disables encryption when the user cannot toggle it', () => {
			mockButtonsData = { ...mockButtonsData, hasE2EEWarning: true, canToggleEncryption: false };

			expect(menuItemByTestID('room-view-header-encryption')?.disabled).toBe(true);
		});

		it('badges the more menu in red whenever troubleshooting is listed', () => {
			mockButtonsData = { ...mockButtonsData, issuesWithNotifications: true };
			expect(actionByTestID(renderRoomActions(), 'room-view-header-kebab')?.badge).toEqual({ color: '#f00' });
			expect(menuItemByTestID('room-view-push-troubleshoot')?.destructive).toBe(true);

			mockButtonsData = { ...mockButtonsData, issuesWithNotifications: false, disableNotifications: true };
			expect(actionByTestID(renderRoomActions(), 'room-view-header-kebab')?.badge).toEqual({ color: '#f00' });
			expect(menuItemByTestID('room-view-push-troubleshoot')?.destructive).toBe(false);
		});

		it('leaves the more menu without a badge when troubleshooting is not listed', () => {
			expect(menuItemByTestID('room-view-push-troubleshoot')).toBeUndefined();
			expect(actionByTestID(renderRoomActions(), 'room-view-header-kebab')?.badge).toBeUndefined();
		});

		it('labels the notifications action by where it leads', () => {
			mockButtonsData = { ...mockButtonsData, issuesWithNotifications: true };
			expect(menuItemByTestID('room-view-push-troubleshoot')?.label).toBe('Troubleshooting');

			mockButtonsData = { ...mockButtonsData, issuesWithNotifications: false, disableNotifications: true };
			expect(menuItemByTestID('room-view-push-troubleshoot')?.label).toBe('Notification preferences');
		});

		it('hides the threads action when threads are disabled', () => {
			expect(actionByTestID(renderRoomActions(), 'room-view-header-threads')).toBeUndefined();
		});

		it('hides the call action on a self DM', () => {
			mockButtonsData = { ...mockButtonsData, isSelfDm: true };
			mockMediaCall.hasMediaCallPermission = true;

			expect(menuItemByTestID('room-view-header-call')).toBeUndefined();
		});

		it('badges threads with the unread thread count in the unread style color', () => {
			mockButtonsData = { ...mockButtonsData, threadsEnabled: true, tunread: ['t1', 't2'], tunreadUser: ['t1'] };

			const threads = actionByTestID(renderRoomActions(), 'room-view-header-threads');

			expect(threads?.badge?.value).toBe(2);
			expect(threads?.badge?.color).toEqual(expect.any(String));
			threads?.onPress?.();
			expect(mockGoThreadsView).toHaveBeenCalled();
		});

		it('leaves threads without a badge when nothing is unread', () => {
			mockButtonsData = { ...mockButtonsData, threadsEnabled: true };

			expect(actionByTestID(renderRoomActions(), 'room-view-header-threads')?.badge).toBeUndefined();
		});
	});

	describe('call action', () => {
		const callAction = () => menuItemByTestID('room-view-header-call');

		it('is absent without media call permission and with calls disabled', () => {
			expect(callAction()).toBeUndefined();
		});

		it('is enabled with media call permission', () => {
			mockMediaCall.hasMediaCallPermission = true;

			expect(callAction()).toMatchObject({ icon: 'phone', label: 'Call', disabled: false });
		});

		it('is disabled during an active call', () => {
			mockMediaCall.hasMediaCallPermission = true;
			mockMediaCall.isInActiveCall = true;

			expect(callAction()?.disabled).toBe(true);
		});

		it('opens the media call sheet', () => {
			mockMediaCall.hasMediaCallPermission = true;

			callAction()?.onPress();

			expect(mockMediaCall.openNewMediaCall).toHaveBeenCalled();
		});

		it('shows the video conference sheet when calls are enabled without media call permission', () => {
			mockVideoConf.callEnabled = true;

			callAction()?.onPress();

			expect(mockVideoConf.showInitCallActionSheet).toHaveBeenCalled();
		});

		it('is disabled when the video conference tooltip is disabled', () => {
			mockVideoConf.callEnabled = true;
			mockVideoConf.disabledTooltip = true;

			expect(callAction()?.disabled).toBe(true);
		});

		it('is disabled by the e2ee warning', () => {
			mockVideoConf.callEnabled = true;
			mockButtonsData = { ...mockButtonsData, hasE2EEWarning: true };

			expect(callAction()?.disabled).toBe(true);
		});
	});

	describe('thread', () => {
		it('offers to follow a thread that is not followed', () => {
			const [follow] = renderThreadActions('tmid-1');

			expect(follow).toMatchObject({
				label: 'Follow thread',
				icon: 'notification-disabled',
				testID: 'room-view-header-follow'
			});
			follow.onPress?.();
			expect(logEvent).toHaveBeenCalledWith(events.ROOM_TOGGLE_FOLLOW_THREADS);
			expect(toggleFollowThread).toHaveBeenCalledWith('tmid-1', false);
		});

		it('offers to unfollow a followed thread', () => {
			mockFollowersByThread = { 'tmid-1': ['user-1'] };

			const [unfollow] = renderThreadActions('tmid-1');

			expect(unfollow).toMatchObject({ label: 'Unfollow thread', icon: 'notification', testID: 'room-view-header-unfollow' });
			unfollow.onPress?.();
			expect(toggleFollowThread).toHaveBeenCalledWith('tmid-1', true);
		});

		it('reflects the follow state of the displayed thread and current user', () => {
			mockFollowersByThread = { 'tmid-1': ['user-1'] };
			expect(renderThreadActions('tmid-1')[0].testID).toBe('room-view-header-unfollow');
			expect(renderThreadActions('tmid-2')[0].testID).toBe('room-view-header-follow');

			mockUserId = 'user-2';
			expect(renderThreadActions('tmid-1')[0].testID).toBe('room-view-header-follow');
		});
	});

	describe('omnichannel', () => {
		beforeEach(() => {
			mockRoomState = { ...mockRoomState, room: { id: 'sub-1', t: 'l', departmentId: 'department-1' } };
		});

		const menuOf = () => {
			const actions = renderOmnichannelActions();
			expect(actions).toHaveLength(1);
			return actions[0].menu ?? [];
		};

		it('shows a single more menu that logs when opened', () => {
			const [more] = renderOmnichannelActions();

			expect(more).toMatchObject({ label: 'More', icon: 'kebab', testID: 'room-view-header-omnichannel-kebab' });
			more.onPress?.();
			expect(logEvent).toHaveBeenCalledWith(events.ROOM_SHOW_MORE_ACTIONS);
		});

		it('offers only the destructive close option when no capability is granted', () => {
			const menu = menuOf();

			expect(labelsOf(menu)).toEqual(['Close']);
			expect(menu[0]).toMatchObject({ icon: 'chat-close', destructive: true });
		});

		it('offers every option in order when all capabilities are granted', () => {
			mockCanPlaceLivechatOnHold = true;
			mockCanReturnQueue = true;
			mockRoomState = { ...mockRoomState, canForwardGuest: true };

			const menu = menuOf();

			expect(labelsOf(menu)).toEqual(['Place chat on hold', 'Forward chat', 'Return to waiting line', 'Close']);
			expect(menu.map(item => item.icon)).toEqual(['pause', 'chat-forward', 'move-to-the-queue', 'chat-close']);
		});

		it('places the chat on hold through the service', () => {
			mockCanPlaceLivechatOnHold = true;

			menuOf()[0].onPress();

			expect(placeLivechatOnHold).toHaveBeenCalledWith({ rid: 'rid-1', navigation: mockNavigation });
		});

		it.each([
			[false, ['ForwardLivechatView', { rid: 'rid-1' }]],
			[true, ['ModalStackNavigator', { screen: 'ForwardLivechatView', params: { rid: 'rid-1' } }]]
		])('navigates to the forward screen (master-detail: %s)', (isMasterDetail, expected) => {
			mockIsMasterDetail = isMasterDetail;
			mockRoomState = { ...mockRoomState, canForwardGuest: true };

			menuOf()[0].onPress();

			expect(mockNavigation.navigate).toHaveBeenCalledWith(...expected);
		});

		it('returns the inquiry only after the confirmation is accepted', async () => {
			mockCanReturnQueue = true;

			menuOf()[0].onPress();

			expect(returnLivechat).not.toHaveBeenCalled();
			await (showConfirmationAlert as jest.Mock).mock.calls[0][0].onPress();
			expect(returnLivechat).toHaveBeenCalledWith('rid-1', 'department-1');
		});

		it('closes the chat with the room department and the request comment setting', () => {
			mockLivechatRequestComment = true;

			menuOf()[0].onPress();

			expect(closeLivechat).toHaveBeenCalledWith({
				rid: 'rid-1',
				departmentId: 'department-1',
				isMasterDetail: false,
				livechatRequestComment: true,
				navigation: mockNavigation
			});
		});
	});
});
