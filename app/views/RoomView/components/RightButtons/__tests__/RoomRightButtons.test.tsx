import { fireEvent, render, screen } from '@testing-library/react-native';

import { events, logEvent } from '~/lib/methods/helpers/log';
import { type RoomStore } from '~/views/RoomView/definitions';
import { RoomRightButtons } from '../RoomRightButtons';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	logEvent: jest.fn()
}));
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));

let mockIsMasterDetail = false;
jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => mockIsMasterDetail
}));

jest.mock('~/theme', () => ({ useTheme: () => ({ colors: { fontDanger: '#f00' } }) }));
jest.mock('~/lib/helpers/getRoomAccessibilityLabel', () => ({ __esModule: true, default: () => 'channel label' }));

jest.mock('~/lib/methods/helpers', () => ({
	getRoomTitle: () => 'Room Title',
	isGroupChat: () => false
}));

let mockThreadsEnabled = true;
jest.mock('~/lib/hooks/useSetting', () => ({
	useSetting: () => mockThreadsEnabled
}));

let mockAppState = {
	login: { user: { id: 'u1', username: 'user', token: 'tok' } },
	troubleshootingNotification: { issuesWithNotifications: false }
};
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));

let mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general' } as Record<string, unknown> };
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));

let mockHasE2EEWarning = false;
jest.mock('~/views/RoomView/hooks/useE2EEStatus', () => ({
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
	isSelfDm: false
};
jest.mock('~/views/RoomView/hooks/useSubscriptionUnreads', () => ({
	useSubscriptionUnreads: () => mockUnreads
}));

let mockCanToggleEncryption = false;
jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: () => [mockCanToggleEncryption]
}));

let mockCallEnabled = false;
jest.mock('~/lib/hooks/useVideoConf', () => ({
	useVideoConf: () => ({ showInitCallActionSheet: jest.fn(), callEnabled: mockCallEnabled, disabledTooltip: false })
}));

let mockHasMediaCallPermission = false;
jest.mock('~/lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => ({
		openNewMediaCall: jest.fn(),
		startCallImmediate: jest.fn(),
		hasMediaCallPermission: mockHasMediaCallPermission,
		isInActiveCall: false
	})
}));

jest.mock('~/containers/Header/components/HeaderButton', () => {
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

const roomStore = { getState: () => mockRoomState } as unknown as RoomStore;

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
		mockUnreads = { tunread: [], tunreadUser: [], tunreadGroup: [], isSelfDm: false };
		mockCanToggleEncryption = false;
		mockCallEnabled = true;
		mockHasMediaCallPermission = false;
	});

	it('renders every present item directly with no overflow menu', () => {
		mockHasE2EEWarning = true;
		mockCanToggleEncryption = true;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };

		renderRoomRightButtons();

		expect(screen.getByTestId('room-view-header-encryption')).toBeOnTheScreen();
		expect(screen.getByTestId('room-view-push-troubleshoot')).toBeOnTheScreen();
		expect(screen.getByTestId('room-view-header-threads')).toBeOnTheScreen();
		expect(screen.getByTestId('room-view-search')).toBeOnTheScreen();
		expect(screen.queryByTestId('room-view-header-more')).not.toBeOnTheScreen();
	});

	it('hides the call button on a self DM', () => {
		mockRoomState = { room: { rid: 'rid-1', t: 'd', name: 'user' } };
		mockUnreads = { ...mockUnreads, isSelfDm: true };

		renderRoomRightButtons();

		expect(screen.queryByTestId('header-call-button-stub')).not.toBeOnTheScreen();
	});

	it('hides the threads button when threads are disabled', () => {
		mockThreadsEnabled = false;

		renderRoomRightButtons();

		expect(screen.queryByTestId('room-view-header-threads')).not.toBeOnTheScreen();
	});

	it.each([false, true])('routes notification issues to push troubleshooting (master-detail: %s)', isMasterDetail => {
		mockIsMasterDetail = isMasterDetail;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };
		mockRoomState = { room: { id: 'rid-1', rid: 'rid-1', t: 'c', name: 'general' } };

		renderRoomRightButtons();

		fireEvent.press(screen.getByTestId('room-view-push-troubleshoot'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith(
			...(isMasterDetail
				? ['ModalStackNavigator', { screen: 'PushTroubleshootView', params: undefined }]
				: ['PushTroubleshootView', undefined])
		);
	});

	it('navigates to the threads screen', () => {
		mockRoomState = { room: { id: 'rid-1', rid: 'rid-1', t: 'c', name: 'general', encrypted: true } };

		renderRoomRightButtons();

		fireEvent.press(screen.getByTestId('room-view-header-threads'));
		expect(mockNavigation.navigate).toHaveBeenCalledWith('ThreadMessagesView', { rid: 'rid-1', t: 'c' });
	});

	it('offers encryption navigation while other items are disabled', () => {
		mockHasE2EEWarning = true;
		mockCanToggleEncryption = true;
		mockAppState = { ...mockAppState, troubleshootingNotification: { issuesWithNotifications: true } };
		mockRoomState = { room: { id: 'rid-1', rid: 'rid-1', t: 'c', name: 'general' } };
		renderRoomRightButtons();

		const encryptionButton = screen.getByTestId('room-view-header-encryption');
		expect(encryptionButton).toHaveProp('disabled', false);

		fireEvent.press(encryptionButton);
		expect(logEvent).toHaveBeenCalledTimes(1);
		expect(logEvent).toHaveBeenCalledWith(events.ROOM_GO_E2EE);
		expect(mockNavigation.navigate).toHaveBeenCalledWith('E2EEToggleRoomView', { rid: 'rid-1' });
	});
});
