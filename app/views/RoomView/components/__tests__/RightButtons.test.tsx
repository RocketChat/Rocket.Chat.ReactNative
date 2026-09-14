import { render } from '@testing-library/react-native';

import { type RoomMembership } from '~/views/RoomView/definitions';
import RightButtons from '../RightButtons/RightButtons';

const mockNavigation = { navigate: jest.fn(), push: jest.fn(), setOptions: jest.fn() };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('~/containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: jest.fn() })
}));
jest.mock('~/lib/hooks/useMasterDetail', () => ({
	...jest.requireActual('~/lib/hooks/useMasterDetail'),
	useMasterDetail: () => false
}));
jest.mock('~/theme', () => ({ useTheme: () => ({ theme: 'light', colors: { fontDanger: '#f00' } }) }));
jest.mock('~/lib/helpers/getRoomAccessibilityLabel', () => ({ __esModule: true, default: () => 'label' }));
jest.mock('~/lib/methods/helpers', () => ({
	...jest.requireActual('~/lib/methods/helpers'),
	getRoomTitle: () => 'Room Title',
	isGroupChat: () => false
}));

let mockAppState = {
	login: { user: { id: 'u1', username: 'user', token: 'tok' } },
	settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
	troubleshootingNotification: { issuesWithNotifications: false },
	permissions: { 'toggle-room-e2e-encryption': ['perm'] }
};
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));

let mockRoomState = {
	room: { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general' } as any,
	membership: 'subscribed' as RoomMembership,
	canForwardGuest: false
};
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));
jest.mock('~/ee/omnichannel/hooks/useCanReturnQueue', () => ({ useCanReturnQueue: () => false }));
jest.mock('~/views/RoomView/hooks/useCanPlaceLivechatOnHold', () => ({ useCanPlaceLivechatOnHold: () => false }));

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
jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: () => [mockHeaderHooks.canToggleEncryption]
}));

jest.mock('~/containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: any) => ReactActual.createElement('Container', null, children),
		Item: (props: any) => ReactActual.createElement('Item', props),
		BadgeUnread: () => null
	};
});

jest.mock('../useHeaderCallAction', () => ({
	useHeaderCallAction: ({ disabled, accessibilityLabel }: any) => ({
		type: 'button',
		label: accessibilityLabel,
		iconName: 'phone',
		disabled,
		onPress: jest.fn()
	})
}));
jest.mock('../../hooks/useGoRoomActionsView', () => ({ useGoRoomActionsView: () => jest.fn() }));
jest.mock('~/lib/methods/helpers/navigation', () => jest.requireActual('~/lib/methods/helpers/navigation/headerItems'));

describe('RightButtons', () => {
	const roomStore = { getState: () => mockRoomState } as any;

	beforeEach(() => {
		jest.clearAllMocks();
		mockAppState = {
			login: { user: { id: 'u1', username: 'user', token: 'tok' } },
			settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
			troubleshootingNotification: { issuesWithNotifications: false },
			permissions: { 'toggle-room-e2e-encryption': ['perm'] }
		};
		mockRoomState = {
			room: { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general' },
			membership: 'subscribed',
			canForwardGuest: false
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

	const items = () => mockNavigation.setOptions.mock.calls.at(-1)?.[0].unstable_headerRightItems();
	const menuItems = () => items().find((item: any) => item.type === 'menu').menu.items;

	it('keeps Search before More and excludes Search from the menu', () => {
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(items().map((item: any) => item.label)).toEqual(['Search messages', 'More']);
		expect(menuItems().map((item: any) => item.label)).toEqual(['Room info', 'Call label', 'Threads']);
	});
	it('keeps Room Info and permitted livechat actions in the native menu', () => {
		mockRoomState.room = { id: 'sub-1', rid: 'rid-1', t: 'l' };
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(menuItems().map((item: any) => item.label)).toEqual(['Room info', 'Close']);
		expect(menuItems().at(-1).destructive).toBe(true);
	});
	it.each([false, true])('preserves thread follow state: %s', following => {
		mockHeaderHooks.isFollowingThread = following;
		render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={roomStore} />);
		expect(items()).toHaveLength(1);
		expect(menuItems().map((item: any) => item.label)).toEqual(['Room info', following ? 'Unfollow thread' : 'Follow thread']);
	});
	it.each([false, true])('preserves E2EE permission gates: %s', permitted => {
		mockE2EEStatus.hasE2EEWarning = true;
		mockHeaderHooks.canToggleEncryption = permitted;
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(items()[0].disabled).toBe(true);
		const menu = menuItems();
		expect(menu.find((item: any) => item.icon?.name === 'lock').disabled).toBe(!permitted);
		expect(menu.find((item: any) => item.icon?.name === 'phone').disabled).toBe(true);
		expect(menu.find((item: any) => item.icon?.name === 'bubble.left.and.bubble.right').disabled).toBe(true);
	});
	it('hides calls for self DMs', () => {
		mockHeaderHooks.isSelfDm = true;
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(menuItems().some((item: any) => item.icon?.name === 'phone')).toBe(false);
	});
	it('refreshes the More badge and clears native actions when invited', () => {
		mockHeaderHooks.tunread = ['thread'];
		const { rerender } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(items()[1].badge.value).toBe(1);
		mockHeaderHooks.tunread = [];
		rerender(<RightButtons rid='rid-1' roomStore={{ ...roomStore }} />);
		expect(items()[1].badge).toBeUndefined();
		mockRoomState.membership = 'invited';
		rerender(<RightButtons rid='rid-1' roomStore={{ ...roomStore }} />);
		expect(items()).toEqual([]);
	});
});
