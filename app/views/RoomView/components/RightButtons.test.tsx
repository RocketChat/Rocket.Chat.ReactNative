import { render } from '@testing-library/react-native';

import RightButtons from './RightButtons';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('../../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: jest.fn() })
}));
jest.mock('../../../lib/hooks/useMasterDetail', () => ({
	...jest.requireActual('../../../lib/hooks/useMasterDetail'),
	useMasterDetail: () => false
}));
jest.mock('../../../theme', () => ({ useTheme: () => ({ colors: { fontDanger: '#f00' } }) }));
jest.mock('../../../lib/helpers/getRoomAccessibilityLabel', () => ({ __esModule: true, default: () => 'label' }));
jest.mock('../../../lib/methods/helpers', () => ({
	...jest.requireActual('../../../lib/methods/helpers'),
	getRoomTitle: () => 'Room Title',
	isGroupChat: () => false
}));

const fakeState = {
	login: { user: { id: 'u1', username: 'user', token: 'tok' } },
	settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
	troubleshootingNotification: { issuesWithNotifications: false },
	permissions: { 'toggle-room-e2e-encryption': ['perm'] }
};
jest.mock('../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof fakeState) => unknown) => selector(fakeState)
}));

let mockRoomState = {
	room: { rid: 'rid-1', t: 'c', name: 'general' },
	canForwardGuest: false
};
jest.mock('../../../ee/omnichannel/hooks/useCanReturnQueue', () => ({ useCanReturnQueue: () => false }));
jest.mock('../hooks/useCanPlaceLivechatOnHold', () => ({ useCanPlaceLivechatOnHold: () => false }));
jest.mock('../stores/RoomStore', () => ({
	useRoomStoreByRid: (_rid: string | undefined, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));

let mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
jest.mock('../hooks/useE2EEStatus', () => ({ useE2EEStatus: () => mockE2EEStatus }));

let mockHeaderHooks = {
	isFollowingThread: false,
	tunread: [] as string[],
	tunreadUser: [] as string[],
	tunreadGroup: [] as string[],
	isSelfDm: false,
	canToggleEncryption: false,
	subscription: undefined
};
jest.mock('../hooks/useThreadFollowing', () => ({ useThreadFollowing: () => mockHeaderHooks.isFollowingThread }));
jest.mock('../hooks/useSubscriptionUnreads', () => ({
	useSubscriptionUnreads: () => {
		const { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription } = mockHeaderHooks;
		return { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription };
	}
}));
jest.mock('../../../lib/hooks/usePermissions', () => ({
	usePermissions: () => [mockHeaderHooks.canToggleEncryption]
}));

jest.mock('../../../containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: any) => ReactActual.createElement('Container', null, children),
		Item: (props: any) => ReactActual.createElement('Item', props),
		BadgeUnread: () => null
	};
});
jest.mock('./HeaderCallButton', () => ({ HeaderCallButton: () => null }));

describe('RightButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRoomState = {
			room: { rid: 'rid-1', t: 'c', name: 'general' },
			canForwardGuest: false
		};
		mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
		mockHeaderHooks = {
			isFollowingThread: false,
			tunread: [],
			tunreadUser: [],
			tunreadGroup: [],
			isSelfDm: false,
			canToggleEncryption: false,
			subscription: undefined
		};
	});

	it('renders nothing without a rid', () => {
		const { toJSON } = render(<RightButtons />);
		expect(toJSON()).toBeNull();
	});

	it('renders search and threads buttons for a regular channel', () => {
		const { queryByTestId } = render(<RightButtons rid='rid-1' />);
		expect(queryByTestId('room-view-search')).toBeTruthy();
		expect(queryByTestId('room-view-header-threads')).toBeTruthy();
	});

	it('renders the omnichannel kebab for a non-preview livechat room', () => {
		mockRoomState = { ...mockRoomState, room: { rid: 'rid-1', t: 'l', name: 'chat' } as any };
		const { queryByTestId } = render(<RightButtons rid='rid-1' />);
		expect(queryByTestId('room-view-header-omnichannel-kebab')).toBeTruthy();
	});

	it('renders the follow toggle when a tmid is present', () => {
		const { queryByTestId } = render(<RightButtons rid='rid-1' tmid='tmid-1' />);
		expect(queryByTestId('room-view-header-follow')).toBeTruthy();
	});

	it('renders the encryption toggle when there is an E2EE warning', () => {
		mockRoomState = { ...mockRoomState, room: { rid: 'rid-1', t: 'c', encrypted: true } as any };
		mockE2EEStatus = { showMissingE2EEKey: true, showE2EEDisabledRoom: false };
		const { queryByTestId } = render(<RightButtons rid='rid-1' />);
		expect(queryByTestId('room-view-header-encryption')).toBeTruthy();
	});
});
