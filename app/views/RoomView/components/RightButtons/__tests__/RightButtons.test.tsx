import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { showActionSheetRef, type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import { type RoomMembership, type RoomStore } from '~/views/RoomView/definitions';
import { closeLivechat } from '~/views/RoomView/services/closeLivechat';
import RightButtons from '../RightButtons';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));
jest.mock('~/containers/ActionSheet', () => ({ showActionSheetRef: jest.fn() }));

let mockIsMasterDetail = false;
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => mockIsMasterDetail }));
jest.mock('~/theme', () => ({ useTheme: () => ({ theme: 'light', colors: { fontDanger: '#f00' } }) }));
jest.mock('~/lib/helpers/getRoomAccessibilityLabel', () => ({ __esModule: true, default: () => 'label' }));
jest.mock('~/lib/methods/helpers', () => ({
	...jest.requireActual('~/lib/methods/helpers'),
	getRoomTitle: () => 'Room Title',
	isGroupChat: () => false,
	hasNativeHeaderBar: false
}));
jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	logEvent: jest.fn()
}));

const mockVideoConf = { showInitCallActionSheet: jest.fn(), callEnabled: true, disabledTooltip: false };
jest.mock('~/lib/hooks/useVideoConf', () => ({ useVideoConf: () => mockVideoConf }));
jest.mock('~/lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => ({
		openNewMediaCall: jest.fn(),
		startCallImmediate: jest.fn(),
		hasMediaCallPermission: false,
		isInActiveCall: false
	})
}));

let mockAppState = {
	login: { user: { id: 'u1', username: 'user', token: 'tok' } },
	settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
	troubleshootingNotification: { issuesWithNotifications: false }
};
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));
jest.mock('~/ee/omnichannel/hooks/useCanReturnQueue', () => ({ useCanReturnQueue: () => false }));
jest.mock('~/views/RoomView/hooks/useCanPlaceLivechatOnHold', () => ({ useCanPlaceLivechatOnHold: () => false }));
jest.mock('~/views/RoomView/services/closeLivechat', () => ({ closeLivechat: jest.fn() }));
jest.mock('~/lib/methods/toggleFollowThread', () => ({ toggleFollowThread: jest.fn() }));

let mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false };
jest.mock('~/views/RoomView/hooks/useE2EEStatus', () => ({ useE2EEStatus: () => mockE2EEStatus }));

let mockHeaderHooks = {
	isFollowingThread: false,
	tunread: [] as string[],
	tunreadUser: [] as string[],
	tunreadGroup: [] as string[],
	isSelfDm: false,
	canToggleEncryption: false
};
jest.mock('~/views/RoomView/hooks/useThreadFollowing', () => ({ useThreadFollowing: () => mockHeaderHooks.isFollowingThread }));
jest.mock('~/views/RoomView/hooks/useSubscriptionUnreads', () => ({
	useSubscriptionUnreads: () => {
		const { tunread, tunreadUser, tunreadGroup, isSelfDm } = mockHeaderHooks;
		return { tunread, tunreadUser, tunreadGroup, isSelfDm };
	}
}));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [mockHeaderHooks.canToggleEncryption] }));

jest.mock('~/containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: { children: unknown }) => ReactActual.createElement('Container', null, children),
		Item: ({
			accessibilityLabel,
			badge,
			color,
			disabled,
			iconName,
			onPress,
			testID
		}: {
			accessibilityLabel?: string;
			badge?: () => unknown;
			color?: string;
			disabled?: boolean;
			iconName?: string;
			onPress: () => void;
			testID?: string;
		}) => ReactActual.createElement('Item', { accessibilityLabel, badge, color, disabled, iconName, onPress, testID }),
		BadgeWarn: ({ color }: { color: string }) => ReactActual.createElement('BadgeWarn', { color }),
		BadgeCount: ({ value, color }: { value: number; color: string }) => ReactActual.createElement('BadgeCount', { value, color })
	};
});

const allTestIDs = [
	'room-view-search',
	'room-view-header-threads',
	'room-view-header-call',
	'room-view-header-encryption',
	'room-view-push-troubleshoot',
	'room-view-header-omnichannel-kebab',
	'room-view-header-follow',
	'room-view-header-unfollow'
];

const expectOnly = (present: string[]) => {
	present.forEach(id => expect(screen.getByTestId(id)).toBeOnTheScreen());
	allTestIDs.filter(id => !present.includes(id)).forEach(id => expect(screen.queryByTestId(id)).not.toBeOnTheScreen());
};

const renderedTestIDs = () => screen.UNSAFE_queryAllByType('Item' as never).map(item => item.props.testID);

const createRoomStore = (room: Record<string, unknown>, membership: RoomMembership = 'subscribed') => {
	const store = createStore(() => ({
		room: { id: 'sub-1', rid: 'rid-1', name: 'general', ...room },
		membership,
		canForwardGuest: false
	}));
	return store as typeof store & RoomStore;
};

const ROOM_BUTTONS = ['room-view-header-call', 'room-view-header-threads', 'room-view-search'];

describe('RightButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsMasterDetail = false;
		mockVideoConf.callEnabled = true;
		mockAppState = {
			login: { user: { id: 'u1', username: 'user', token: 'tok' } },
			settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
			troubleshootingNotification: { issuesWithNotifications: false }
		};
		mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false };
		mockHeaderHooks = {
			isFollowingThread: false,
			tunread: [],
			tunreadUser: [],
			tunreadGroup: [],
			isSelfDm: false,
			canToggleEncryption: false
		};
	});

	describe('routing', () => {
		it('renders nothing without a rid', () => {
			const { toJSON } = render(<RightButtons roomStore={createRoomStore({ t: 'c' })} />);

			expect(toJSON()).toBeNull();
		});

		it.each([
			['an invited room', { t: 'c' }, 'invited'],
			['a queued omnichannel room', { t: 'l', status: 'queued' }, 'subscribed'],
			['an omnichannel room still in the preview window', { t: 'l' }, 'preview'],
			['an invited omnichannel room', { t: 'l' }, 'invited']
		])('renders nothing for %s', (_case, room, membership) => {
			const { toJSON } = render(<RightButtons rid='rid-1' roomStore={createRoomStore(room, membership as RoomMembership)} />);

			expect(toJSON()).toBeNull();
		});

		it('renders only the kebab for an active omnichannel room even with a tmid', () => {
			render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={createRoomStore({ t: 'l' })} />);

			expectOnly(['room-view-header-omnichannel-kebab']);
		});

		it('renders the thread buttons when a tmid is given', () => {
			render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={createRoomStore({ t: 'c' })} />);

			expectOnly(['room-view-header-follow']);
		});

		it('renders call, threads and search in order for a regular channel', () => {
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			expect(renderedTestIDs()).toEqual(ROOM_BUTTONS);
		});

		it('swaps the room buttons for the omnichannel kebab when the room type changes in place', () => {
			const roomStore = createRoomStore({ t: 'c' });
			render(<RightButtons rid='rid-1' roomStore={roomStore} />);
			expectOnly(ROOM_BUTTONS);

			act(() => roomStore.setState({ room: { id: 'sub-1', rid: 'rid-1', t: 'l' } as never }));

			expectOnly(['room-view-header-omnichannel-kebab']);
		});

		it('switches to the thread buttons when a tmid appears and back when it is cleared', () => {
			const roomStore = createRoomStore({ t: 'c' });
			render(<RightButtons rid='rid-1' roomStore={roomStore} />);

			screen.rerender(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={roomStore} />);
			expectOnly(['room-view-header-follow']);

			screen.rerender(<RightButtons rid='rid-1' roomStore={roomStore} />);
			expectOnly(ROOM_BUTTONS);
		});

		it.each([
			['c', undefined, 'c', 'INVITED', []],
			['c', 'INVITED', 'c', undefined, ROOM_BUTTONS],
			['l', undefined, 'l', 'queued', []],
			['l', 'queued', 'l', undefined, ['room-view-header-omnichannel-kebab']],
			['c', undefined, 'l', undefined, ['room-view-header-omnichannel-kebab']]
		])('updates buttons when the same Room changes from %s/%s to %s/%s', (t, status, nextType, nextStatus, expected) => {
			const room = { id: 'sub-1', rid: 'rid-1', t, status };
			const roomStore = createRoomStore(room, status === 'INVITED' ? 'invited' : 'subscribed');
			render(<RightButtons rid='rid-1' roomStore={roomStore} />);

			act(() => {
				Object.assign(room, { t: nextType, status: nextStatus });
				roomStore.setState({ room: room as never, membership: nextStatus === 'INVITED' ? 'invited' : 'subscribed' });
			});

			expectOnly(expected);
		});
	});

	describe('room', () => {
		it('enables encryption while the e2ee warning disables the other buttons', () => {
			mockE2EEStatus = { showMissingE2EEKey: true, showE2EEDisabledRoom: false, hasE2EEWarning: true };
			mockHeaderHooks = { ...mockHeaderHooks, canToggleEncryption: true };

			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c', encrypted: true })} />);

			expectOnly(['room-view-header-encryption', ...ROOM_BUTTONS]);
			expect(screen.getByTestId('room-view-header-encryption')).toHaveProp('disabled', false);
			expect(screen.getByTestId('room-view-search')).toHaveProp('disabled', true);
		});

		it.each([
			['the user cannot toggle encryption', { showMissingE2EEKey: true, showE2EEDisabledRoom: false }],
			['the room has e2ee disabled', { showMissingE2EEKey: false, showE2EEDisabledRoom: true }]
		])('disables the encryption button when %s', (_case, status) => {
			mockE2EEStatus = { ...status, hasE2EEWarning: true };

			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c', encrypted: true })} />);

			expect(screen.getByTestId('room-view-header-encryption')).toHaveProp('disabled', true);
		});

		it('navigates to the encryption toggle', () => {
			mockE2EEStatus = { showMissingE2EEKey: true, showE2EEDisabledRoom: false, hasE2EEWarning: true };
			mockHeaderHooks = { ...mockHeaderHooks, canToggleEncryption: true };
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			fireEvent.press(screen.getByTestId('room-view-header-encryption'));

			expect(logEvent).toHaveBeenCalledTimes(1);
			expect(logEvent).toHaveBeenCalledWith(events.ROOM_GO_E2EE);
			expect(mockNavigation.navigate).toHaveBeenCalledWith('E2EEToggleRoomView', { rid: 'rid-1' });
		});

		it('tints the push troubleshoot button when there are notification issues', () => {
			mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			expect(renderedTestIDs()).toEqual(['room-view-push-troubleshoot', ...ROOM_BUTTONS]);
			expect(screen.getByTestId('room-view-push-troubleshoot')).toHaveProp('color', '#f00');
		});

		it('shows an untinted push troubleshoot button when notifications are disabled for the room', () => {
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c', disableNotifications: true })} />);

			expect(screen.getByTestId('room-view-push-troubleshoot')).toHaveProp('color', undefined);
		});

		it.each([false, true])('routes notification issues to push troubleshooting (master-detail: %s)', isMasterDetail => {
			mockIsMasterDetail = isMasterDetail;
			mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			fireEvent.press(screen.getByTestId('room-view-push-troubleshoot'));

			expect(mockNavigation.navigate).toHaveBeenCalledWith(
				...(isMasterDetail
					? ['ModalStackNavigator', { screen: 'PushTroubleshootView', params: undefined }]
					: ['PushTroubleshootView', undefined])
			);
		});

		it('hides the threads button when threads are disabled', () => {
			mockAppState = { ...mockAppState, settings: { ...mockAppState.settings, Threads_enabled: false } };

			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			expectOnly(['room-view-header-call', 'room-view-search']);
		});

		it('hides the call button on a self DM', () => {
			mockHeaderHooks = { ...mockHeaderHooks, isSelfDm: true };

			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'd', name: 'user' })} />);

			expectOnly(['room-view-header-threads', 'room-view-search']);
		});

		it('starts a video conference from the call button', () => {
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			fireEvent.press(screen.getByTestId('room-view-header-call'));

			expect(mockVideoConf.showInitCallActionSheet).toHaveBeenCalled();
		});

		it('navigates to the threads screen', () => {
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			fireEvent.press(screen.getByTestId('room-view-header-threads'));

			expect(mockNavigation.navigate).toHaveBeenCalledWith('ThreadMessagesView', { rid: 'rid-1', t: 'c' });
		});

		it('badges the threads button with the unread thread count', () => {
			mockHeaderHooks = { ...mockHeaderHooks, tunread: ['t1', 't2'] };
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'c' })} />);

			const badge = screen.getByTestId('room-view-header-threads').props.badge();

			expect(badge.props.value).toBe(2);
		});
	});

	describe('thread', () => {
		it.each([
			[false, 'room-view-header-follow', 'Follow thread'],
			[true, 'room-view-header-unfollow', 'Unfollow thread']
		])('toggles the follow state of a thread (following: %s)', (isFollowingThread, testID, label) => {
			mockHeaderHooks = { ...mockHeaderHooks, isFollowingThread };
			render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={createRoomStore({ t: 'c' })} />);

			expect(screen.getByTestId(testID)).toHaveProp('accessibilityLabel', label);
			fireEvent.press(screen.getByTestId(testID));

			expect(toggleFollowThread).toHaveBeenCalledWith('tmid-1', isFollowingThread);
		});
	});

	describe('omnichannel', () => {
		it('opens the more actions sheet and closes the chat from it', () => {
			render(<RightButtons rid='rid-1' roomStore={createRoomStore({ t: 'l', departmentId: 'department-1' })} />);

			fireEvent.press(screen.getByTestId('room-view-header-omnichannel-kebab'));

			expect(logEvent).toHaveBeenCalledWith(events.ROOM_SHOW_MORE_ACTIONS);
			const { options } = (showActionSheetRef as jest.Mock).mock.calls[0][0] as { options: TActionSheetOptionsItem[] };
			expect(options).toEqual([expect.objectContaining({ title: 'Close', icon: 'chat-close', danger: true })]);
			options[0].onPress();
			expect(closeLivechat).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', departmentId: 'department-1' }));
		});
	});
});
