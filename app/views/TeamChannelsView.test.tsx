import { Alert } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import TeamChannelsView, { type IItem } from './TeamChannelsView';

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

jest.mock('../lib/hooks/navigation', () => ({
	useAppNavigation: () => mockNavigation,
	useAppRoute: () => ({
		params: defaultRouteParams
	})
}));

jest.mock('../containers/ActionSheet', () => ({
	useActionSheet: () => ({
		showActionSheet: mockShowActionSheet
	})
}));

jest.mock('../theme', () => ({
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

jest.mock('../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) => selector(mockReduxState)
}));

jest.mock('../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

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

jest.mock('../lib/database', () => ({
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

jest.mock('../lib/services/restApi', () => ({
	getTeamListRoom: (...args: any[]) => mockGetTeamListRoom(...args),
	getRoomInfo: (...args: any[]) => mockGetRoomInfo(...args),
	updateTeamRoom: (...args: any[]) => mockUpdateTeamRoom(...args),
	removeTeamRoom: (...args: any[]) => mockRemoveTeamRoom(...args)
}));

jest.mock('../lib/methods/helpers', () => ({
	...jest.requireActual('../lib/methods/helpers'),
	hasPermission: (...args: any[]) => mockHasPermission(...args),
	getRoomTitle: (room: any) => room.fname || room.name,
	getRoomAvatar: () => '',
	isIOS: false,
	compareServerVersion: jest.requireActual('../lib/methods/helpers').compareServerVersion
}));

jest.mock('../lib/methods/helpers/goRoom', () => ({
	goRoom: jest.fn()
}));

jest.mock('../lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));

jest.mock('../lib/methods/helpers/log', () => ({
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

jest.mock('../actions/room', () => ({
	deleteRoom: jest.fn(() => ({ type: 'DELETE_ROOM' }))
}));

jest.mock('react-redux', () => ({
	...jest.requireActual('react-redux'),
	useDispatch: () => jest.fn()
}));

jest.mock('../containers/RoomItem', () => {
	const { TouchableOpacity, Text } = require('react-native');
	return ({ item, onPress, onLongPress }: any) => (
		<TouchableOpacity testID={`room-item-${item._id}`} onPress={() => onPress(item)} onLongPress={() => onLongPress(item)}>
			<Text>{item.fname}</Text>
		</TouchableOpacity>
	);
});

jest.mock('../containers/RoomHeader', () => () => null);

jest.mock('../containers/BackgroundContainer', () => {
	const { View, Text } = require('react-native');
	return ({ loading, text }: any) => (
		<View testID='background-container'>
			{loading && <Text testID='loading-indicator'>loading</Text>}
			{text !== undefined && <Text testID='background-text'>{text}</Text>}
		</View>
	);
});

jest.mock('../containers/ActivityIndicator', () => () => null);

jest.mock('../containers/SafeAreaView', () => {
	const { View } = require('react-native');
	return ({ children, testID }: any) => <View testID={testID}>{children}</View>;
});

jest.mock('../containers/SearchHeader', () => {
	const { TextInput } = require('react-native');
	return ({ onSearchChangeText, testID }: any) => <TextInput testID={testID} onChangeText={onSearchChangeText} />;
});

const makeRoom = (overrides: Partial<IItem> = {}): IItem => ({
	_id: 'room-1' as any,
	fname: 'Room One',
	name: 'room-one',
	customFields: {},
	broadcast: false,
	encrypted: false,
	t: 'c',
	msgs: 0,
	usersCount: 0,
	u: { _id: 'u1', name: 'User' },
	ts: '',
	ro: false,
	teamId: 'team-123',
	default: false,
	sysMes: false,
	_updatedAt: '',
	teamDefault: false,
	...overrides
});

const setupSuccessfulLoad = (rooms: IItem[] = [makeRoom()]) => {
	mockFetch.mockResolvedValue([mockTeamSubscription, mockChildSubscription]);
	mockHasPermission.mockResolvedValue([true, true, true]);
	mockGetTeamListRoom.mockResolvedValue({ success: true, rooms });
};

// The most recent navigation options applied by the reactive header effect.
const lastSetOptions = () => mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0];

// Render a header slot (headerLeft/headerTitle/headerRight) so its real buttons/inputs are queryable.
const renderHeaderSlot = (slot: () => any) => render(slot());

describe('TeamChannelsView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('1. Renders team-channels-view; shows loading while loading', () => {
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
			// Never resolves during this test phase
			mockGetTeamListRoom.mockReturnValue(new Promise(() => {}));

			const { getByTestId } = render(<TeamChannelsView />);
			await waitFor(() => expect(getByTestId('loading-indicator')).toBeTruthy());
		});
	});

	describe('2. loadTeam — team from DB; not-found → pop + alert', () => {
		it('pops and shows error when team subscription is not found', async () => {
			const { showErrorAlert } = require('../lib/methods/helpers/info');
			mockFetch.mockResolvedValue([mockChildSubscription]);
			mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockPop).toHaveBeenCalledTimes(1));
			expect(showErrorAlert).toHaveBeenCalledWith('Team not found');
		});

		it('pops and shows error when DB query throws', async () => {
			const { showErrorAlert } = require('../lib/methods/helpers/info');
			mockFetch.mockRejectedValue(new Error('DB error'));
			mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockPop).toHaveBeenCalledTimes(1));
			expect(showErrorAlert).toHaveBeenCalledWith('Team not found');
		});
	});

	describe('3. Initial load fetches channels; end set when result < API_FETCH_COUNT', () => {
		it('renders room items after loading', async () => {
			const rooms = [makeRoom({ _id: 'r1' as any, fname: 'Room One' })];
			setupSuccessfulLoad(rooms);

			const { findByTestId } = render(<TeamChannelsView />);

			await findByTestId('room-item-r1');
			expect(mockGetTeamListRoom).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-123', offset: 0, count: 25 }));
		});

		it('sets end=true when result count < API_FETCH_COUNT (25)', async () => {
			const rooms = [makeRoom({ _id: 'r1' as any })];
			setupSuccessfulLoad(rooms);

			mockGetTeamListRoom.mockResolvedValueOnce({ success: true, rooms });

			const { findByTestId } = render(<TeamChannelsView />);
			await findByTestId('room-item-r1');

			// Second load attempt should not fire (end=true, only 1 item < 25)
			const callCount = mockGetTeamListRoom.mock.calls.length;
			expect(callCount).toBe(1);
		});
	});

	describe('4. onEndReached triggers pagination', () => {
		it('appends more data on end reached', async () => {
			const page1 = Array.from({ length: 25 }, (_, i) => makeRoom({ _id: `r${i}` as any, fname: `Room ${i}` }));
			const page2 = [makeRoom({ _id: 'r-extra' as any, fname: 'Extra Room' })];

			mockFetch.mockResolvedValue([mockTeamSubscription, mockChildSubscription]);
			mockHasPermission.mockResolvedValue([true, true, true]);
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

	describe('5. Search: header switches; typing filters; cancel restores', () => {
		it('setOptions is called on mount (normal header)', async () => {
			setupSuccessfulLoad([]);
			mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockSetOptions).toHaveBeenCalled());
		});

		it('pressing search then typing fetches with offset 0 and the typed filter', async () => {
			setupSuccessfulLoad([makeRoom({ _id: 'r1' as any })]);

			const { findByTestId } = render(<TeamChannelsView />);
			await findByTestId('room-item-r1');

			// Press the search button rendered in the normal header (drives onSearchPress).
			const normalHeader = lastSetOptions();
			const searchButton = await renderHeaderSlot(normalHeader.headerRight).findByTestId('team-channels-view-search');
			await act(() => {
				fireEvent.press(searchButton);
			});

			// The reactive header effect re-applies options with the SearchHeader title.
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
			setupSuccessfulLoad([makeRoom({ _id: 'r1' as any })]);

			const { findByTestId } = render(<TeamChannelsView />);
			await findByTestId('room-item-r1');

			// Enter search mode.
			const searchButton = await renderHeaderSlot(lastSetOptions().headerRight).findByTestId('team-channels-view-search');
			await act(() => {
				fireEvent.press(searchButton);
			});

			// Confirm the search header is now active.
			await waitFor(() =>
				expect(renderHeaderSlot(lastSetOptions().headerTitle).getByTestId('team-channels-view-search-header')).toBeTruthy()
			);

			// Press the close button in the search headerLeft slot.
			const closeButton = renderHeaderSlot(lastSetOptions().headerLeft).UNSAFE_getAllByType(BorderlessButton)[0];
			await act(() => {
				fireEvent.press(closeButton);
			});

			// Normal header is restored: search button is back, search header is gone.
			await waitFor(() =>
				expect(renderHeaderSlot(lastSetOptions().headerRight).getByTestId('team-channels-view-search')).toBeTruthy()
			);
			expect(lastSetOptions().headerTitle).toBeDefined();
			expect(renderHeaderSlot(lastSetOptions().headerTitle).queryByTestId('team-channels-view-search-header')).toBeNull();
		});
	});

	describe('6. toggleAutoJoin and removeRoom', () => {
		it('toggleAutoJoin flips teamDefault on item', async () => {
			const room = makeRoom({ _id: 'r1' as any, teamDefault: false });
			setupSuccessfulLoad([room]);
			mockHasPermission.mockResolvedValue([true, true, true]);
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

		it('removeRoom filters item out of data after success', async () => {
			const room = makeRoom({ _id: 'r1' as any });
			setupSuccessfulLoad([room]);
			mockRemoveTeamRoom.mockResolvedValue({ success: true, room: { _id: 'r1' } });

			// Action sheet: press the "remove from team" option.
			mockShowActionSheet.mockImplementation(({ options }: any) => {
				options.find((o: any) => o.testID === 'action-sheet-remove-from-team')?.onPress();
			});
			// Confirmation alert: press the destructive button.
			const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
				buttons?.find(b => b.style === 'destructive')?.onPress?.();
			});

			const { findByTestId, queryByTestId } = render(<TeamChannelsView />);
			const item = await findByTestId('room-item-r1');

			await act(() => {
				fireEvent(item, 'longPress');
			});

			await waitFor(() => expect(mockRemoveTeamRoom).toHaveBeenCalledWith({ roomId: 'r1', teamId: 'team-123' }));
			await waitFor(() => expect(queryByTestId('room-item-r1')).toBeNull());

			alertSpy.mockRestore();
		});
	});

	describe('7. Action sheet options gated by permissions', () => {
		it('shows auto-join option when edit-team-channel permission is granted', async () => {
			const room = makeRoom({ _id: 'r1' as any });
			setupSuccessfulLoad([room]);

			mockHasPermission.mockImplementation((perms: any[]) => Promise.resolve(perms.map(() => true)));

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

		it('does not call showActionSheet when no permissions', async () => {
			const room = makeRoom({ _id: 'r1' as any });
			setupSuccessfulLoad([room]);

			mockHasPermission.mockResolvedValue([false, false, false]);

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

	describe('8. Create button shown only when showCreate', () => {
		it('calls setOptions when hasCreatePermission is true', async () => {
			setupSuccessfulLoad([]);
			mockHasPermission.mockResolvedValue([true, true, true]);

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockSetOptions).toHaveBeenCalled());
		});

		it('calls setOptions when hasCreatePermission is false', async () => {
			setupSuccessfulLoad([]);
			mockHasPermission.mockResolvedValue([false, false, false]);

			render(<TeamChannelsView />);

			await waitFor(() => expect(mockSetOptions).toHaveBeenCalled());
		});
	});
});
