import { render } from '@testing-library/react-native';

import RightButtons from '../RightButtons/RightButtons';
import { makeRoomReads } from '../../__tests__/roomStoreFixture';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('../../../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: jest.fn() })
}));
jest.mock('../../../../lib/hooks/useMasterDetail', () => ({
	...jest.requireActual('../../../../lib/hooks/useMasterDetail'),
	useMasterDetail: () => false
}));
jest.mock('../../../../theme', () => ({ useTheme: () => ({ colors: { fontDanger: '#f00' } }) }));
jest.mock('../../../../lib/helpers/getRoomAccessibilityLabel', () => ({ __esModule: true, default: () => 'label' }));
jest.mock('../../../../lib/methods/helpers', () => ({
	...jest.requireActual('../../../../lib/methods/helpers'),
	getRoomTitle: () => 'Room Title',
	isGroupChat: () => false
}));

let mockAppState = {
	login: { user: { id: 'u1', username: 'user', token: 'tok' } },
	settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
	troubleshootingNotification: { issuesWithNotifications: false },
	permissions: { 'toggle-room-e2e-encryption': ['perm'] }
};
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));

let mockRoomState = {
	...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general' }),
	canForwardGuest: false
};
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));
jest.mock('../../../../ee/omnichannel/hooks/useCanReturnQueue', () => ({ useCanReturnQueue: () => false }));
jest.mock('../../hooks/useCanPlaceLivechatOnHold', () => ({ useCanPlaceLivechatOnHold: () => false }));

let mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false };
jest.mock('../../hooks/useE2EEStatus', () => ({ useE2EEStatus: () => mockE2EEStatus }));

let mockHeaderHooks = {
	isFollowingThread: false,
	tunread: [] as string[],
	tunreadUser: [] as string[],
	tunreadGroup: [] as string[],
	isSelfDm: false,
	canToggleEncryption: false,
	subscription: undefined as any
};
jest.mock('../../hooks/useThreadFollowing', () => ({ useThreadFollowing: () => mockHeaderHooks.isFollowingThread }));
jest.mock('../../hooks/useSubscriptionUnreads', () => ({
	useSubscriptionUnreads: () => {
		const { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription } = mockHeaderHooks;
		return { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription };
	}
}));
jest.mock('../../../../lib/hooks/usePermissions', () => ({
	usePermissions: () => [mockHeaderHooks.canToggleEncryption]
}));

jest.mock('../../../../containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: any) => ReactActual.createElement('Container', null, children),
		Item: (props: any) => ReactActual.createElement('Item', props),
		BadgeUnread: () => null
	};
});
jest.mock('../RightButtons/HeaderCallButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		HeaderCallButton: ({ rid, disabled, accessibilityLabel }: { rid: string; disabled: boolean; accessibilityLabel: string }) =>
			ReactActual.createElement('CallButton', { rid, disabled, accessibilityLabel, testID: 'header-call-button-stub' })
	};
});

const allTestIDs = [
	'room-view-search',
	'room-view-header-threads',
	'header-call-button-stub',
	'room-view-header-encryption',
	'room-view-push-troubleshoot',
	'room-view-header-omnichannel-kebab',
	'room-view-header-follow',
	'room-view-header-unfollow'
];

describe('RightButtons', () => {
	const roomStore = {} as any;

	const expectOnly = (queryByTestId: (id: string) => unknown, present: string[]) => {
		present.forEach(id => expect(queryByTestId(id)).toBeTruthy());
		allTestIDs.filter(id => !present.includes(id)).forEach(id => expect(queryByTestId(id)).toBeNull());
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockAppState = {
			login: { user: { id: 'u1', username: 'user', token: 'tok' } },
			settings: { Threads_enabled: true, Livechat_request_comment_when_closing_conversation: false },
			troubleshootingNotification: { issuesWithNotifications: false },
			permissions: { 'toggle-room-e2e-encryption': ['perm'] }
		};
		mockRoomState = {
			...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general' }),
			canForwardGuest: false
		};
		mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false };
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
		const { queryByTestId, toJSON } = render(<RightButtons roomStore={roomStore} />);
		expect(toJSON()).toBeNull();
		expectOnly(queryByTestId, []);
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders nothing for an invited room', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general', status: 'INVITED' }) };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(toJSON()).toBeNull();
		expectOnly(queryByTestId, []);
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders nothing for a queued omnichannel room', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'l', name: 'chat', status: 'queued' }) };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(toJSON()).toBeNull();
		expectOnly(queryByTestId, []);
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders only the kebab for an active omnichannel room', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'l', name: 'chat' }) };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, ['room-view-header-omnichannel-kebab']);
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders the unfollow button for a followed thread', () => {
		mockHeaderHooks = { ...mockHeaderHooks, isFollowingThread: true };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, ['room-view-header-unfollow']);
		expect(queryByTestId('room-view-header-unfollow')).toHaveProp('accessibilityLabel', 'Unfollow thread');
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders the follow button for an unfollowed thread', () => {
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, ['room-view-header-follow']);
		expect(queryByTestId('room-view-header-follow')).toHaveProp('accessibilityLabel', 'Follow thread');
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders call, threads and search for a regular channel', () => {
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, ['header-call-button-stub', 'room-view-header-threads', 'room-view-search']);
		expect(toJSON()).toMatchSnapshot();
	});

	it('enables the encryption button when the user can toggle encryption', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general', encrypted: true }) };
		mockE2EEStatus = { showMissingE2EEKey: true, showE2EEDisabledRoom: false, hasE2EEWarning: true };
		mockHeaderHooks = { ...mockHeaderHooks, canToggleEncryption: true };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, [
			'room-view-header-encryption',
			'header-call-button-stub',
			'room-view-header-threads',
			'room-view-search'
		]);
		expect(queryByTestId('room-view-header-encryption')).toHaveProp('disabled', false);
		expect(queryByTestId('room-view-search')).toHaveProp('disabled', true);
		expect(toJSON()).toMatchSnapshot();
	});

	it('disables the encryption button when the user cannot toggle encryption', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general', encrypted: true }) };
		mockE2EEStatus = { showMissingE2EEKey: true, showE2EEDisabledRoom: false, hasE2EEWarning: true };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, [
			'room-view-header-encryption',
			'header-call-button-stub',
			'room-view-header-threads',
			'room-view-search'
		]);
		expect(queryByTestId('room-view-header-encryption')).toHaveProp('disabled', true);
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders the encryption button when the room has e2ee disabled', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general', encrypted: true }) };
		mockE2EEStatus = { showMissingE2EEKey: false, showE2EEDisabledRoom: true, hasE2EEWarning: true };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, [
			'room-view-header-encryption',
			'header-call-button-stub',
			'room-view-header-threads',
			'room-view-search'
		]);
		expect(queryByTestId('room-view-header-encryption')).toHaveProp('disabled', true);
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders the push troubleshoot button when there are notification issues', () => {
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, [
			'room-view-push-troubleshoot',
			'header-call-button-stub',
			'room-view-header-threads',
			'room-view-search'
		]);
		expect(queryByTestId('room-view-push-troubleshoot')).toHaveProp('color', '#f00');
		expect(toJSON()).toMatchSnapshot();
	});

	it('renders the push troubleshoot button when notifications are disabled for the room', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'c', name: 'general', disableNotifications: true }) };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, [
			'room-view-push-troubleshoot',
			'header-call-button-stub',
			'room-view-header-threads',
			'room-view-search'
		]);
		expect(queryByTestId('room-view-push-troubleshoot')).toHaveProp('color', '');
		expect(toJSON()).toMatchSnapshot();
	});

	it('hides the threads button when threads are disabled', () => {
		mockAppState = {
			...mockAppState,
			settings: { Threads_enabled: false, Livechat_request_comment_when_closing_conversation: false }
		};
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, ['header-call-button-stub', 'room-view-search']);
		expect(toJSON()).toMatchSnapshot();
	});

	it('labels the threads button with the direct mention unread count', () => {
		mockHeaderHooks = { ...mockHeaderHooks, tunread: ['tm-1'], tunreadUser: ['tm-1'] };
		const { queryByTestId } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(queryByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads, 1 unread, direct mention');
	});

	it('labels the threads button with the group mention unread count', () => {
		mockHeaderHooks = { ...mockHeaderHooks, tunread: ['tm-1'], tunreadGroup: ['tm-1'] };
		const { queryByTestId } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(queryByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads, 1 unread, group mention');
	});

	it('labels the threads button with the plain unread count', () => {
		mockHeaderHooks = { ...mockHeaderHooks, tunread: ['tm-1', 'tm-2'] };
		const { queryByTestId } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expect(queryByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads, 2 unread');
	});

	it('hides the call button on a self DM', () => {
		mockRoomState = { ...mockRoomState, ...makeRoomReads({ rid: 'rid-1', t: 'd', name: 'user' }) };
		mockHeaderHooks = { ...mockHeaderHooks, isSelfDm: true };
		const { queryByTestId, toJSON } = render(<RightButtons rid='rid-1' roomStore={roomStore} />);
		expectOnly(queryByTestId, ['room-view-header-threads', 'room-view-search']);
		expect(toJSON()).toMatchSnapshot();
	});
});
