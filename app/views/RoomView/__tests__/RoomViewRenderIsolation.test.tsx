import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore as createReduxStore } from 'redux';
import { createStore, type StoreApi } from 'zustand';

import RoomView from '../index';
import { type IRoomViewProps, type RoomState } from '../definitions';
import { useE2EEStatus } from '../hooks/useE2EEStatus';

const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: mockSetOptions })
}));
jest.mock('~/lib/methods/helpers', () => ({
	hasNativeHeaderBar: false,
	getUidDirectMessage: jest.fn(),
	getRoomTitle: () => 'general',
	isGroupChat: () => false
}));
jest.mock('~/lib/methods/isInviteSubscription', () => ({ isInviteSubscription: () => false }));
jest.mock('../hooks/useE2EEStatus', () => ({
	useE2EEStatus: jest.fn(() => ({ showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false }))
}));
jest.mock('../hooks/useGoRoomActionsView', () => ({ useGoRoomActionsView: () => jest.fn() }));
jest.mock('../RoomScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../components/LeftButtons', () => ({ __esModule: true, default: 'LeftButtons' }));
jest.mock('../components/RoomViewHeader/RoomHeaderActions', () => ({ RoomHeaderActions: 'RoomHeaderActions' }));
jest.mock('~/containers/RoomHeader', () => ({ __esModule: true, default: 'RoomHeader' }));
jest.mock('../hooks/useRoomRightButtonsData', () => ({ useRoomRightButtonsData: jest.fn() }));
jest.mock('../hooks/useHeaderCallPress', () => ({ useHeaderCallPress: jest.fn() }));

const mockRoomStore: { current: StoreApi<Partial<RoomState>> | null } = { current: null };
jest.mock('../stores/RoomStore', () => ({
	createRoomStore: () => mockRoomStore.current,
	observeRoom: (_rid: string, _store: unknown, onReady: () => void) => {
		onReady();
		return jest.fn();
	}
}));

const latestHeaderTitle = () =>
	mockSetOptions.mock.calls
		.map(([options]) => options)
		.filter(options => 'headerTitle' in options)
		.at(-1)
		.headerTitle();

it('updates the header without re-rendering the room content when only header data changes', () => {
	mockRoomStore.current = createStore<Partial<RoomState>>(() => ({
		room: { id: 'sub-1', rid: 'rid-1', t: 'c', topic: 'Old topic' } as RoomState['room'],
		roomUserId: null
	}));
	const route = { params: { rid: 'rid-1', t: 'c' } } as unknown as IRoomViewProps['route'];
	const navigation = { setOptions: mockSetOptions } as unknown as IRoomViewProps['navigation'];
	render(
		<Provider store={createReduxStore(() => ({ server: { version: '6.1.0' } }))}>
			<RoomView route={route} navigation={navigation} />
		</Provider>
	);
	const contentRenders = jest.mocked(useE2EEStatus).mock.calls.length;

	act(() => {
		mockRoomStore.current?.setState({
			room: { id: 'sub-1', rid: 'rid-1', t: 'c', topic: 'New topic' } as RoomState['room']
		});
	});

	expect(latestHeaderTitle().props.subtitle).toBe('New topic');
	expect(jest.mocked(useE2EEStatus).mock.calls.length).toBe(contentRenders);
});
