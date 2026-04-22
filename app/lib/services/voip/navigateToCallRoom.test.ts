import { goRoom } from '../../methods/helpers/goRoom';
import Navigation from '../../navigation/appNavigation';
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

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		getCurrentRoute: jest.fn(),
		navigate: jest.fn()
	}
}));

const mockGetState = jest.mocked(useCallStore.getState);
const mockGoRoom = jest.mocked(goRoom);
const mockNavigation = jest.mocked(Navigation);

type CallStoreSnapshot = ReturnType<typeof useCallStore.getState>;

/** Partial mock: tests only need fields read by `navigateToCallRoom`. */
function mockCallStoreState(
	snapshot: Pick<CallStoreSnapshot, 'roomId' | 'contact' | 'focused' | 'toggleFocus'>
): CallStoreSnapshot {
	return snapshot as unknown as CallStoreSnapshot;
}

describe('navigateToCallRoom', () => {
	const toggleFocus = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'RoomsListView' } as any);
	});

	it('does not navigate when roomId is null', async () => {
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: null,
				contact: { username: 'u', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockGoRoom).not.toHaveBeenCalled();
		expect(toggleFocus).not.toHaveBeenCalled();
		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it('navigates when contact has both username and sipExtension (RC user with extension)', async () => {
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'u', sipExtension: '100' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'u', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});

	it('does not navigate when username is missing', async () => {
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: undefined, sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockGoRoom).not.toHaveBeenCalled();
		expect(toggleFocus).not.toHaveBeenCalled();
		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it('minimizes first when CallView is focused then navigates', async () => {
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: true,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(toggleFocus).toHaveBeenCalledTimes(1);
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
		expect(toggleFocus.mock.invocationCallOrder[0]).toBeLessThan(mockGoRoom.mock.invocationCallOrder[0]);
	});

	it('navigates without toggleFocus when already minimized', async () => {
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(toggleFocus).not.toHaveBeenCalled();
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});

	it('navigates to ChatsStackNavigator first when on ProfileView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'ProfileView' } as any);
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
		expect(mockNavigation.navigate.mock.invocationCallOrder[0]).toBeLessThan(mockGoRoom.mock.invocationCallOrder[0]);
	});

	it('navigates to ChatsStackNavigator first when on AccessibilityAndAppearanceView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'AccessibilityAndAppearanceView' } as any);
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(mockGoRoom).toHaveBeenCalled();
		expect(mockNavigation.navigate.mock.invocationCallOrder[0]).toBeLessThan(mockGoRoom.mock.invocationCallOrder[0]);
	});

	it('navigates to ChatsStackNavigator first when on SettingsView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'SettingsView' } as any);
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(mockGoRoom).toHaveBeenCalled();
		expect(mockNavigation.navigate.mock.invocationCallOrder[0]).toBeLessThan(mockGoRoom.mock.invocationCallOrder[0]);
	});

	it('does not navigate to ChatsStackNavigator when already on RoomView', async () => {
		mockNavigation.getCurrentRoute.mockReturnValue({ name: 'RoomView' } as any);
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: true });

		expect(mockNavigation.navigate).not.toHaveBeenCalled();
		expect(mockGoRoom).toHaveBeenCalled();
	});

	it('passes isMasterDetail from the caller into goRoom', async () => {
		mockGetState.mockReturnValue(
			mockCallStoreState({
				roomId: 'rid-1',
				contact: { username: 'alice', sipExtension: '' },
				focused: false,
				toggleFocus
			})
		);

		await navigateToCallRoom({ isMasterDetail: false });

		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: false
		});
	});
});
