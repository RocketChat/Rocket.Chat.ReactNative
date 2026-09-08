import { fireEvent, render, screen } from '@testing-library/react-native';

import { events, logEvent } from '../../../../../lib/methods/helpers/log';
import { type RoomStore } from '../../../definitions';
import { RoomRightButtons } from '../RoomRightButtons';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('../../../../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../../../../lib/methods/helpers/log'),
	logEvent: jest.fn()
}));
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));

let mockIsMasterDetail = false;
jest.mock('../../../../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => mockIsMasterDetail
}));

jest.mock('../../../../../theme', () => ({ useTheme: () => ({ colors: { fontDanger: '#f00' } }) }));
jest.mock('../../../../../lib/helpers/getRoomAccessibilityLabel', () => ({ __esModule: true, default: () => 'channel label' }));
jest.mock('../../../../../lib/methods/helpers', () => ({
	...jest.requireActual('../../../../../lib/methods/helpers'),
	getRoomTitle: () => 'Room Title',
	isGroupChat: () => false
}));

let mockThreadsEnabled = true;
jest.mock('../../../../../lib/hooks/useSetting', () => ({
	useSetting: () => mockThreadsEnabled
}));

let mockAppState = {
	login: { user: { id: 'u1', username: 'user', token: 'tok' } },
	troubleshootingNotification: { issuesWithNotifications: false }
};
jest.mock('../../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));

let mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general' } as Record<string, unknown> };
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));

let mockHasE2EEWarning = false;
jest.mock('../../../hooks/useE2EEStatus', () => ({
	useE2EEStatus: () => ({
		showMissingE2EEKey: mockHasE2EEWarning,
		showE2EEDisabledRoom: false,
		hasE2EEWarning: mockHasE2EEWarning
	})
}));

let mockUnreads = {
	tunread: [] as string[],
	tunreadUser: [] as string[],
	tunreadGroup: [] as string[],
	isSelfDm: false,
	subscription: undefined as unknown
};
jest.mock('../../../hooks/useSubscriptionUnreads', () => ({
	useSubscriptionUnreads: () => mockUnreads
}));

let mockCanToggleEncryption = false;
jest.mock('../../../../../lib/hooks/usePermissions', () => ({
	usePermissions: () => [mockCanToggleEncryption]
}));

jest.mock('../../../../../containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: { children: unknown }) => ReactActual.createElement('Container', null, children),
		Item: ({
			accessibilityLabel,
			color,
			disabled,
			iconName,
			onPress,
			testID
		}: {
			accessibilityLabel?: string;
			color?: string;
			disabled?: boolean;
			iconName: string;
			onPress: () => void;
			testID: string;
		}) =>
			ReactActual.createElement('Item', {
				accessibilityLabel,
				color,
				disabled,
				iconName,
				onPress,
				testID
			}),
		BadgeUnread: () => null
	};
});
jest.mock('../HeaderCallButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		HeaderCallButton: ({ rid, disabled, accessibilityLabel }: { rid: string; disabled: boolean; accessibilityLabel: string }) =>
			ReactActual.createElement('CallButton', { rid, disabled, accessibilityLabel, testID: 'header-call-button-stub' })
	};
});

const roomStore = {} as RoomStore;

const renderRoomRightButtons = () => render(<RoomRightButtons rid='rid-1' roomStore={roomStore} />);

describe('RoomRightButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsMasterDetail = false;
		mockThreadsEnabled = true;
		mockAppState = {
			login: { user: { id: 'u1', username: 'user', token: 'tok' } },
			troubleshootingNotification: { issuesWithNotifications: false }
		};
		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general' } };
		mockHasE2EEWarning = false;
		mockUnreads = { tunread: [], tunreadUser: [], tunreadGroup: [], isSelfDm: false, subscription: undefined };
		mockCanToggleEncryption = false;
	});

	it('renders the call, threads and search buttons for a regular channel', () => {
		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('iconName', 'threads');
		expect(screen.getByTestId('room-view-search')).toHaveProp('accessibilityLabel', 'Search messages');
		expect(screen.queryByTestId('room-view-header-encryption')).not.toBeOnTheScreen();
		expect(screen.queryByTestId('room-view-push-troubleshoot')).not.toBeOnTheScreen();
	});

	it('labels the call button with the room accessibility name', () => {
		renderRoomRightButtons();

		expect(screen.getByTestId('header-call-button-stub')).toHaveProp('accessibilityLabel', 'Call channel label');
	});

	it('hides the call button on a self DM', () => {
		mockRoomState = { room: { rid: 'rid-1', t: 'd', name: 'user' } };
		mockUnreads = { ...mockUnreads, isSelfDm: true };

		renderRoomRightButtons();

		expect(screen.queryByTestId('header-call-button-stub')).not.toBeOnTheScreen();
		expect(screen.getByTestId('room-view-search')).toBeOnTheScreen();
	});

	it('enables the encryption button and disables the others on an e2ee warning with permission', () => {
		mockHasE2EEWarning = true;
		mockCanToggleEncryption = true;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-encryption')).toHaveProp('disabled', false);
		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('disabled', true);
		expect(screen.getByTestId('room-view-search')).toHaveProp('disabled', true);
		expect(screen.getByTestId('header-call-button-stub')).toHaveProp('disabled', true);
		expect(screen.getByTestId('room-view-push-troubleshoot')).toHaveProp('disabled', true);
	});

	it('disables the encryption button on an e2ee warning without permission', () => {
		mockHasE2EEWarning = true;

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-encryption')).toHaveProp('disabled', true);
	});

	it.each([false, true])('routes notification issues to push troubleshooting (master-detail: %s)', isMasterDetail => {
		mockIsMasterDetail = isMasterDetail;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };
		mockUnreads = { ...mockUnreads, subscription: { id: 'rid-1' } };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-push-troubleshoot')).toHaveProp('color', '#f00');
		fireEvent.press(screen.getByTestId('room-view-push-troubleshoot'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith(
			...(isMasterDetail
				? ['ModalStackNavigator', { screen: 'PushTroubleshootView', params: undefined }]
				: ['PushTroubleshootView', undefined])
		);
	});

	it.each([false, true])('routes disabled Room notifications to preferences (master-detail: %s)', isMasterDetail => {
		mockIsMasterDetail = isMasterDetail;
		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general', disableNotifications: true } };
		mockUnreads = { ...mockUnreads, subscription: { id: 'rid-1' } };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-push-troubleshoot')).toHaveProp('color', '');
		fireEvent.press(screen.getByTestId('room-view-push-troubleshoot'));
		const params = { rid: 'rid-1', room: { id: 'rid-1' } };
		expect(mockNavigation.navigate).toHaveBeenCalledWith(
			...(isMasterDetail ? ['ModalStackNavigator', { screen: 'NotificationPrefView', params }] : ['NotificationPrefView', params])
		);
	});

	it('does not navigate from the notification button without a subscription', () => {
		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general', disableNotifications: true } };

		renderRoomRightButtons();

		fireEvent.press(screen.getByTestId('room-view-push-troubleshoot'));

		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it('hides the threads button when threads are disabled', () => {
		mockThreadsEnabled = false;

		renderRoomRightButtons();

		expect(screen.queryByTestId('room-view-header-threads')).not.toBeOnTheScreen();
		expect(screen.getByTestId('room-view-search')).toBeOnTheScreen();
	});

	it('labels the threads button without unreads', () => {
		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads');
	});

	it('labels the threads button with the direct mention unread count', () => {
		mockUnreads = { ...mockUnreads, tunread: ['tm-1'], tunreadUser: ['tm-1'] };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads, 1 unread, direct mention');
	});

	it('labels the threads button with the group mention unread count', () => {
		mockUnreads = { ...mockUnreads, tunread: ['tm-1'], tunreadGroup: ['tm-1'] };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads, 1 unread, group mention');
	});

	it('labels the threads button with the plain unread count', () => {
		mockUnreads = { ...mockUnreads, tunread: ['tm-1', 'tm-2'] };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('accessibilityLabel', 'Threads, 2 unread');
	});

	it('navigates to the threads and search screens on stack mode', () => {
		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general', encrypted: true } };

		renderRoomRightButtons();

		fireEvent.press(screen.getByTestId('room-view-header-threads'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith('ThreadMessagesView', { rid: 'rid-1', t: 'c' });

		fireEvent.press(screen.getByTestId('room-view-search'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith('SearchMessagesView', { rid: 'rid-1', t: 'c', encrypted: true });
	});

	it('navigates through the modal stack on master-detail mode', () => {
		mockIsMasterDetail = true;
		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general', encrypted: true } };

		renderRoomRightButtons();

		fireEvent.press(screen.getByTestId('room-view-header-threads'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith('ModalStackNavigator', {
			screen: 'ThreadMessagesView',
			params: { rid: 'rid-1', t: 'c' }
		});

		fireEvent.press(screen.getByTestId('room-view-search'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith('ModalStackNavigator', {
			screen: 'SearchMessagesView',
			params: { rid: 'rid-1', t: 'c', encrypted: true, showCloseModal: true }
		});
	});

	it.each([false, true])('offers encryption navigation while other buttons are disabled (master-detail: %s)', isMasterDetail => {
		mockIsMasterDetail = isMasterDetail;
		mockHasE2EEWarning = true;
		mockCanToggleEncryption = true;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };
		mockUnreads = { ...mockUnreads, subscription: { id: 'rid-1' } };
		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-threads')).toHaveProp('disabled', true);
		expect(screen.getByTestId('room-view-search')).toHaveProp('disabled', true);
		expect(screen.getByTestId('room-view-push-troubleshoot')).toHaveProp('disabled', true);
		expect(screen.getByTestId('room-view-header-encryption')).toHaveProp('disabled', false);

		fireEvent.press(screen.getByTestId('room-view-header-encryption'));
		expect(logEvent).toHaveBeenCalledTimes(1);
		expect(logEvent).toHaveBeenCalledWith(events.ROOM_GO_E2EE);
		expect(mockNavigation.navigate).toHaveBeenCalledWith(
			...(isMasterDetail
				? ['ModalStackNavigator', { screen: 'E2EEToggleRoomView', params: { rid: 'rid-1' } }]
				: ['E2EEToggleRoomView', { rid: 'rid-1' }])
		);
	});
});
