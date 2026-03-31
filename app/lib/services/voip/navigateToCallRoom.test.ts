import { goRoom } from '../../methods/helpers/goRoom';
import Navigation from '../../navigation/appNavigation';
import { store } from '../../store/auxStore';
import { useCallStore } from './useCallStore';
import { navigateToCallRoom } from './navigateToCallRoom';
import { SubscriptionType } from '../../../definitions';

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('../../methods/helpers/goRoom', () => ({
	goRoom: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		getCurrentRoute: jest.fn(),
		navigate: jest.fn()
	}
}));

const mockGetState = jest.mocked(useCallStore.getState);
const mockGoRoom = jest.mocked(goRoom);
const mockStoreGetState = jest.mocked(store.getState);
const mockNavigation = jest.mocked(Navigation);

describe('navigateToCallRoom', () => {
	const toggleFocus = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockStoreGetState.mockReturnValue({ app: { isMasterDetail: true } } as ReturnType<typeof store.getState>);
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'RoomsListView' } as any);
	});

	it('does not navigate when roomId is null', async () => {
		mockGetState.mockReturnValue({
			roomId: null,
			contact: { username: 'u', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockGoRoom).not.toHaveBeenCalled();
		expect(toggleFocus).not.toHaveBeenCalled();
	});

	it('does not navigate for SIP contact', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'u', sipExtension: '100' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockGoRoom).not.toHaveBeenCalled();
	});

	it('does not navigate when username is missing', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: undefined, sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockGoRoom).not.toHaveBeenCalled();
	});

	it('minimizes first when CallView is focused then navigates', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: true,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(toggleFocus).toHaveBeenCalledTimes(1);
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});

	it('navigates without toggleFocus when already minimized', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(toggleFocus).not.toHaveBeenCalled();
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});

	it('navigates to ChatsStackNavigator first when on ProfileView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'ProfileView' } as any);
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});

	it('navigates to ChatsStackNavigator first when on AccessibilityAndAppearanceView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'AccessibilityAndAppearanceView' } as any);
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(mockGoRoom).toHaveBeenCalled();
	});

	it('navigates to ChatsStackNavigator first when on SettingsView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'SettingsView' } as any);
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(mockGoRoom).toHaveBeenCalled();
	});

	it('does not navigate to ChatsStackNavigator when already on RoomView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'RoomView' } as any);
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockNavigation.navigate).not.toHaveBeenCalled();
		expect(mockGoRoom).toHaveBeenCalled();
	});
});
