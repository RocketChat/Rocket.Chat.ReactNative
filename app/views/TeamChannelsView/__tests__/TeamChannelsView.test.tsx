import { Alert } from 'react-native';
import { BorderlessButton } from '~/containers/GestureButtons';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import TeamChannelsView from '..';
import { type TTeamChannel } from '../types';

const mockShowActionSheet = jest.fn();
const mockPop = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();

const mockNavigation = {
	addListener: jest.fn(() => jest.fn()),
	setOptions: mockSetOptions,
	pop: mockPop,
	navigate: mockNavigate
};

const defaultRouteParams = {
	teamId: 'team-123',
	joined: true
};

jest.mock('~/lib/hooks/navigation', () => ({
	useAppNavigation: () => mockNavigation,
	useAppRoute: () => ({
		params: defaultRouteParams
	})
}));

jest.mock('~/containers/ActionSheet', () => ({
	useActionSheet: () => ({
		showActionSheet: mockShowActionSheet
	})
}));

jest.mock('~/theme', () => ({
	useTheme: () => ({
		colors: {
			surfaceRoom: 'white',
			fontDefault: '#111',
			fontHint: '#999',
			fontTitlesLabels: '#222'
		}
	})
}));

const mockReduxState = {
	server: { version: '7.0.0' },
	settings: {
		UI_Use_Real_Name: false,
		Store_Last_Message: false
	},
	permissions: {
		'add-team-channel': ['add-team-channel-role'],
		'move-room-to-team': ['move-room-to-team-role'],
		'edit-team-channel': ['edit-team-channel-role'],
		'remove-team-channel': ['remove-team-channel-role'],
		'delete-c': ['delete-c-role'],
		'create-c': ['create-c-role'],
		'create-team-channel': ['create-team-channel-role'],
		'create-p': ['create-p-role'],
		'create-team-group': ['create-team-group-role'],
		'delete-p': ['delete-p-role']
	},
	sortPreferences: {
		showAvatar: false,
		displayMode: 'expanded'
	}
};

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) => selector(mockReduxState)
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

const mockUseTeamChannelPermissions = jest.fn();

jest.mock('~/lib/hooks/useTeamChannelPermissions', () => ({
	useTeamChannelPermissions: (...args: any[]) => mockUseTeamChannelPermissions(...args)
}));

const mockUsePermissions = jest.fn();

jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: (...args: any[]) => mockUsePermissions(...args)
}));

const allowCreate = (canCreateNew: boolean) =>
	mockUseTeamChannelPermissions.mockReturnValue({ canCreateNew, canAddExisting: false });

const mockTeamSubscription = {
	_id: 'sub-main',
	rid: 'room-main',
	teamId: 'team-123',
	teamMain: true,
	t: 'c',
	name: 'team-channel',
	fname: 'Team Channel',
	topic: 'A team topic',
	observe: jest.fn(() => ({ subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) }))
};

const mockChildSubscription = {
	_id: 'sub-child',
	rid: 'room-child',
	teamId: 'team-123',
	teamMain: false,
	t: 'c',
	name: 'child-channel',
	fname: 'Child Channel',
	observe: jest.fn()
};

const mockFetch = jest.fn();
const mockFind = jest.fn();
const mockQuery = jest.fn(() => ({ fetch: mockFetch }));
const mockGet = jest.fn(() => ({ query: mockQuery, find: mockFind }));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return { get: mockGet };
		}
	}
}));

const mockGetTeamListRoom = jest.fn();
const mockGetRoomInfo = jest.fn();
const mockUpdateTeamRoom = jest.fn();
const mockRemoveTeamRoom = jest.fn();
const mockHasPermission = jest.fn();

jest.mock('~/lib/services/restApi', () => ({
	getTeamListRoom: (...args: any[]) => mockGetTeamListRoom(...args),
	getRoomInfo: (...args: any[]) => mockGetRoomInfo(...args),
	updateTeamRoom: (...args: any[]) => mockUpdateTeamRoom(...args),
	removeTeamRoom: (...args: any[]) => mockRemoveTeamRoom(...args)
}));

jest.mock('~/lib/methods/helpers', () => ({
	...jest.requireActual('~/lib/methods/helpers'),
	hasPermission: (...args: any[]) => mockHasPermission(...args),
	getRoomTitle: (room: any) => room.fname || room.name,
	getRoomAvatar: () => '',
	isIOS: false,
	compareServerVersion: jest.requireActual('~/lib/methods/helpers').compareServerVersion
}));

jest.mock('~/lib/methods/helpers/goRoom', () => ({
	goRoom: jest.fn()
}));

jest.mock('~/lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn(),
	showErrorAlertWithEMessage: jest.requireActual('~/lib/methods/helpers/info').showErrorAlertWithEMessage
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	logEvent: jest.fn(),
	events: {
		TC_SEARCH: 'TC_SEARCH',
		TC_CANCEL_SEARCH: 'TC_CANCEL_SEARCH',
		TC_GO_ACTIONS: 'TC_GO_ACTIONS',
		TC_GO_ROOM: 'TC_GO_ROOM',
		TC_TOGGLE_AUTOJOIN: 'TC_TOGGLE_AUTOJOIN',
		TC_TOGGLE_AUTOJOIN_F: 'TC_TOGGLE_AUTOJOIN_F',
		TC_DELETE_ROOM: 'TC_DELETE_ROOM',
		TC_DELETE_ROOM_F: 'TC_DELETE_ROOM_F',
		ROOM_SHOW_BOX_ACTIONS: 'ROOM_SHOW_BOX_ACTIONS'
	}
}));

jest.mock('~/actions/room', () => ({
	deleteRoom: jest.fn(() => ({ type: 'DELETE_ROOM' }))
}));

jest.mock('react-redux', () => ({
	...jest.requireActual('react-redux'),
	useDispatch: () => jest.fn()
}));

jest.mock('~/containers/RoomItem', () => {
	const { TouchableOpacity, Text } = require('react-native');
	return ({ item, onPress, onLongPress }: any) => (
		<TouchableOpacity testID={`room-item-${item._id}`} onPress={() => onPress(item)} onLongPress={() => onLongPress(item)}>
			<Text>{item.fname}</Text>
		</TouchableOpacity>
	);
});

jest.mock('~/containers/RoomHeader', () => () => null);

jest.mock('~/containers/BackgroundContainer', () => {
	const { View, Text } = require('react-native');
	return ({ loading, text }: any) => (
		<View testID='background-container'>
			{loading && <Text testID='loading-indicator'>loading</Text>}
			{text !== undefined && <Text testID='background-text'>{text}</Text>}
		</View>
	);
});

jest.mock('~/containers/ActivityIndicator', () => () => null);

jest.mock('~/containers/SafeAreaView', () => {
	const { View } = require('react-native');
	return ({ children, testID }: any) => <View testID={testID}>{children}</View>;
});

jest.mock('~/containers/SearchHeader', () => {
	const { TextInput } = require('react-native');
	return ({ onSearchChangeText, testID }: any) => <TextInput testID={testID} onChangeText={onSearchChangeText} />;
});

const makeRoom = (overrides: Partial<TTeamChannel> = {}): TTeamChannel =>
	({
		_id: 'room-1',
		fname: 'Room One',
		name: 'room-one',
		t: 'c',
		teamId: 'team-123',
		teamDefault: false,
		...overrides
	}) as TTeamChannel;

const setupSuccessfulLoad = (rooms: TTeamChannel[] = [makeRoom()]) => {
	mockFetch.mockResolvedValue([mockTeamSubscription, mockChildSubscription]);
	mockHasPermission.mockResolvedValue([true]);
	mockUsePermissions.mockReturnValue([true, true]);
	allowCreate(true);
	mockGetTeamListRoom.mockResolvedValue({ success: true, rooms });
};

const lastSetOptions = () => mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0];

const renderHeaderSlot = (slot: () => any) => render(slot());

describe('TeamChannelsView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		[
			mockShowActionSheet,
			mockFetch,
			mockGetTeamListRoom,
			mockGetRoomInfo,
			mockUpdateTeamRoom,
			mockRemoveTeamRoom,
			mockHasPermission,
			mockUsePermissions,
			mockUseTeamChannelPermissions
		].forEach(mock => mock.mockReset());
		mockUsePermissions.mockReturnValue([false, false]);
		allowCreate(false);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('rendering', () => {
		it('renders SafeAreaView with testID team-channels-view', () => {
			mockFetch.mockResolvedValue([mockTeamSubscription]);
			mockHasPermission.mockResolvedValue([false]);
			mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });

			const { getByTestId } = render(<TeamChannelsView />);
			expect(getByTestId('team-channels-view')).toBeTruthy();
		});

		it('shows loading background container while loading=true', async () => {
			mockFetch.mockResolvedValue([mockTeamSubscription]);
			mockHasPermission.mockResolvedValue([false]);
			mockGetTeamListRoom.mockReturnValue(new Promise(() => {}));

			const { getByTestId } = render(<TeamChannelsView />);
			await waitFor(() => expect(getByTestId('loading-indicator')).toBeTruthy());
		});
	});

	describe('missing team', () => {
		it('pops with an alert when the team subscription is not found', async () => {
			const { showErrorAlert } = require('~/lib/methods/helpers/info');
			mockFetch.mockResolvedValue([mockChildSubscription]);
			mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockPop).toHaveBeenCalledTimes(1));
			expect(showErrorAlert).toHaveBeenCalledWith('Team not found');
		});

		it('pops with an alert when the database query throws', async () => {
			const { showErrorAlert } = require('~/lib/methods/helpers/info');
			mockFetch.mockRejectedValue(new Error('DB error'));
			mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockPop).toHaveBeenCalledTimes(1));
			expect(showErrorAlert).toHaveBeenCalledWith('Team not found');
		});
	});

	describe('initial load', () => {
		it('renders room items after loading', async () => {
			const rooms = [makeRoom({ _id: 'r1', fname: 'Room One' })];
			setupSuccessfulLoad(rooms);

			const { findByTestId } = render(<TeamChannelsView />);

			await findByTestId('room-item-r1');
			expect(mockGetTeamListRoom).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-123', offset: 0, count: 25 }));
		});

		it('does not fetch again after a short first page', async () => {
			const rooms = [makeRoom({ _id: 'r1' })];
			setupSuccessfulLoad(rooms);

			mockGetTeamListRoom.mockResolvedValueOnce({ success: true, rooms });

			const { findByTestId } = render(<TeamChannelsView />);
			await findByTestId('room-item-r1');

			const callCount = mockGetTeamListRoom.mock.calls.length;
			expect(callCount).toBe(1);
		});
	});

	describe('pagination', () => {
		it('appends more data on end reached', async () => {
			const page1 = Array.from({ length: 25 }, (_, i) => makeRoom({ _id: `r${i}`, fname: `Room ${i}` }));
			const page2 = [makeRoom({ _id: 'r-extra', fname: 'Extra Room' })];

			mockFetch.mockResolvedValue([mockTeamSubscription, mockChildSubscription]);
			mockHasPermission.mockResolvedValue([true]);
			mockGetTeamListRoom
				.mockResolvedValueOnce({ success: true, rooms: page1 })
				.mockResolvedValueOnce({ success: true, rooms: page2 });

			const { UNSAFE_getByType, findByTestId } = render(<TeamChannelsView />);

			await findByTestId('room-item-r0');

			const { FlatList } = require('react-native');
			const flatList = UNSAFE_getByType(FlatList);

			await act(() => {
				flatList.props.onEndReached?.();
			});

			await waitFor(() => expect(mockGetTeamListRoom).toHaveBeenCalledTimes(2));
		});
	});

	describe('search header', () => {
		it('sets the search header before the team loads', () => {
			setupSuccessfulLoad([]);
			mockFetch.mockReturnValue(new Promise(() => {}));

			render(<TeamChannelsView />);

			const headerRight = renderHeaderSlot(lastSetOptions().headerRight);
			expect(headerRight.getByTestId('team-channels-view-search')).toBeTruthy();
			expect(headerRight.queryByTestId('team-channels-view-create')).toBeNull();
		});

		it('pressing search then typing fetches with offset 0 and the typed filter', async () => {
			setupSuccessfulLoad([makeRoom({ _id: 'r1' })]);

			const { findByTestId } = render(<TeamChannelsView />);
			await findByTestId('room-item-r1');

			const normalHeader = lastSetOptions();
			const searchButton = await renderHeaderSlot(normalHeader.headerRight).findByTestId('team-channels-view-search');
			await act(() => {
				fireEvent.press(searchButton);
			});

			await waitFor(() => expect(lastSetOptions().headerTitle).toBeDefined());
			mockGetTeamListRoom.mockClear();

			const searchHeader = lastSetOptions();
			const searchInput = renderHeaderSlot(searchHeader.headerTitle).getByTestId('team-channels-view-search-header');
			await act(() => {
				fireEvent.changeText(searchInput, 'design');
			});

			await waitFor(
				() => expect(mockGetTeamListRoom).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, filter: 'design' })),
				{ timeout: 2000 }
			);
		});

		it('pressing the close button in search mode restores the normal header', async () => {
			setupSuccessfulLoad([makeRoom({ _id: 'r1' })]);

			const { findByTestId } = render(<TeamChannelsView />);
			await findByTestId('room-item-r1');

			const searchButton = await renderHeaderSlot(lastSetOptions().headerRight).findByTestId('team-channels-view-search');
			await act(() => {
				fireEvent.press(searchButton);
			});

			await waitFor(() =>
				expect(renderHeaderSlot(lastSetOptions().headerTitle).getByTestId('team-channels-view-search-header')).toBeTruthy()
			);

			const closeButton = renderHeaderSlot(lastSetOptions().headerLeft).UNSAFE_getAllByType(BorderlessButton)[0];
			await act(() => {
				fireEvent.press(closeButton);
			});

			await waitFor(() =>
				expect(renderHeaderSlot(lastSetOptions().headerRight).getByTestId('team-channels-view-search')).toBeTruthy()
			);
			expect(lastSetOptions().headerTitle).toBeDefined();
			expect(renderHeaderSlot(lastSetOptions().headerTitle).queryByTestId('team-channels-view-search-header')).toBeNull();
		});
	});

	describe('opening a channel', () => {
		it('alerts the error message when the room info request fails without a server error', async () => {
			const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
			setupSuccessfulLoad([makeRoom({ _id: 'r1' })]);
			mockGetRoomInfo.mockRejectedValue(new Error('Network request failed'));

			const { findByTestId } = render(<TeamChannelsView />);
			fireEvent.press(await findByTestId('room-item-r1'));

			await waitFor(() => expect(alert).toHaveBeenCalledWith('', 'Network request failed', expect.anything(), expect.anything()));
		});

		it('alerts "Not allowed" when the server refuses access', async () => {
			const { showErrorAlert } = require('~/lib/methods/helpers/info');
			setupSuccessfulLoad([makeRoom({ _id: 'r1' })]);
			mockGetRoomInfo.mockRejectedValue({ data: { error: 'not-allowed' } });

			const { findByTestId } = render(<TeamChannelsView />);
			fireEvent.press(await findByTestId('room-item-r1'));

			await waitFor(() => expect(showErrorAlert).toHaveBeenCalledWith('Not allowed'));
		});
	});

	describe('channel actions', () => {
		it('toggling auto-join sends the flipped value', async () => {
			const room = makeRoom({ _id: 'r1', teamDefault: false });
			setupSuccessfulLoad([room]);
			mockUpdateTeamRoom.mockResolvedValue({ success: true });

			mockShowActionSheet.mockImplementation(({ options }: any) => {
				const autoJoinOption = options.find((o: any) => o.testID === 'action-sheet-auto-join');
				autoJoinOption?.onPress();
			});

			const { findByTestId } = render(<TeamChannelsView />);
			const item = await findByTestId('room-item-r1');

			await act(() => {
				fireEvent(item, 'longPress');
			});

			await waitFor(() => expect(mockUpdateTeamRoom).toHaveBeenCalledWith({ roomId: 'r1', isDefault: true }));
		});

		it('removing a channel from the team drops it from the list', async () => {
			const room = makeRoom({ _id: 'r1' });
			setupSuccessfulLoad([room]);
			mockRemoveTeamRoom.mockResolvedValue({ success: true, room: { _id: 'r1' } });

			mockShowActionSheet.mockImplementation(({ options }: any) => {
				options.find((o: any) => o.testID === 'action-sheet-remove-from-team')?.onPress();
			});
			jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
				buttons?.find(b => b.style === 'destructive')?.onPress?.();
			});

			const { findByTestId, queryByTestId } = render(<TeamChannelsView />);
			const item = await findByTestId('room-item-r1');

			await act(() => {
				fireEvent(item, 'longPress');
			});

			await waitFor(() => expect(mockRemoveTeamRoom).toHaveBeenCalledWith({ roomId: 'r1', teamId: 'team-123' }));
			await waitFor(() => expect(queryByTestId('room-item-r1')).toBeNull());
		});
	});

	describe('channel action permissions', () => {
		it('offers auto-join when edit-team-channel is granted', async () => {
			const room = makeRoom({ _id: 'r1' });
			setupSuccessfulLoad([room]);

			const { findByTestId } = render(<TeamChannelsView />);
			const item = await findByTestId('room-item-r1');

			await act(() => {
				fireEvent(item, 'longPress');
			});

			await waitFor(() => expect(mockShowActionSheet).toHaveBeenCalled());
			const { options } = mockShowActionSheet.mock.calls[0][0];
			const hasAutoJoin = options?.some((o: any) => o.testID === 'action-sheet-auto-join');
			expect(hasAutoJoin).toBe(true);
		});

		it('shows no action sheet without any permission', async () => {
			const room = makeRoom({ _id: 'r1' });
			setupSuccessfulLoad([room]);

			mockUsePermissions.mockReturnValue([false, false]);
			mockHasPermission.mockResolvedValue([false]);

			const { findByTestId } = render(<TeamChannelsView />);
			const item = await findByTestId('room-item-r1');

			await act(() => {
				fireEvent(item, 'longPress');
			});

			await waitFor(() => {
				expect(mockShowActionSheet).not.toHaveBeenCalled();
			});
		});
	});

	describe('create button', () => {
		it('checks create permissions against the team room', async () => {
			setupSuccessfulLoad([]);

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockUseTeamChannelPermissions).toHaveBeenCalledWith('room-main', 'c'));
		});

		it('renders the create button in the header when create is permitted', async () => {
			setupSuccessfulLoad([]);
			allowCreate(true);

			render(<TeamChannelsView />);

			await waitFor(() =>
				expect(renderHeaderSlot(lastSetOptions().headerRight).getByTestId('team-channels-view-create')).toBeTruthy()
			);
		});

		it('hides the create button in the header when create is not permitted', async () => {
			setupSuccessfulLoad([]);
			allowCreate(false);

			render(<TeamChannelsView />);

			await waitFor(() =>
				expect(renderHeaderSlot(lastSetOptions().headerRight).getByTestId('team-channels-view-search')).toBeTruthy()
			);
			expect(renderHeaderSlot(lastSetOptions().headerRight).queryByTestId('team-channels-view-create')).toBeNull();
		});
	});
});
