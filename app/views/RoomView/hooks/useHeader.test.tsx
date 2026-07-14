import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { SubscriptionType } from '../../../definitions/ISubscription';
import { type RoomState, type RoomStore } from '../stores/RoomStore';
import { useHeader } from './useHeader';

let mockTestStore: RoomStore;

jest.mock('../stores/RoomStore', () => ({
	useRoomStoreByRid: (_rid: string | undefined, selector: (state: RoomState) => unknown) =>
		jest.requireActual('zustand').useStore(mockTestStore, selector)
}));
jest.mock('./useGoRoomActionsView', () => ({ useGoRoomActionsView: jest.fn(() => jest.fn()) }));
jest.mock('../LeftButtons', () => ({ __esModule: true, default: 'LeftButtons' }));
jest.mock('../RightButtons', () => ({ __esModule: true, default: 'RightButtons' }));
jest.mock('../../../containers/RoomHeader', () => ({ __esModule: true, default: 'RoomHeader' }));
jest.mock('../../../lib/methods/helpers', () => ({
	getRoomTitle: jest.fn(() => 'Room Title'),
	isGroupChat: jest.fn(() => false)
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));

const mockSetOptions = jest.fn();
const defaultRouteParams = { rid: 'rid-1', tmid: undefined, t: SubscriptionType.CHANNEL, name: 'general' };
let mockRouteParams: typeof defaultRouteParams = { ...defaultRouteParams };

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: mockSetOptions }),
	useRoute: () => ({ params: mockRouteParams })
}));

const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c', name: 'general' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		loading: false,
		lastOpen: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		init: jest.fn(),
		join: jest.fn(),
		markMessageSent: jest.fn(),
		...overrides
	}));

describe('useHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRouteParams = { ...defaultRouteParams };
		mockTestStore = makeRoomStore();
	});

	it('sets headerLeft, headerTitle and headerRight when rid is present', () => {
		renderHook(() => useHeader());

		expect(mockSetOptions).toHaveBeenCalledTimes(1);
		const options = mockSetOptions.mock.calls[0][0];
		expect(typeof options.headerLeft).toBe('function');
		expect(typeof options.headerTitle).toBe('function');
		expect(typeof options.headerRight).toBe('function');
	});

	it('sets only the headerLeft spacer and returns when rid is missing', () => {
		mockRouteParams = { ...defaultRouteParams, rid: undefined as unknown as string };

		renderHook(() => useHeader());

		expect(mockSetOptions).toHaveBeenCalledTimes(1);
		const options = mockSetOptions.mock.calls[0][0];
		expect(typeof options.headerLeft).toBe('function');
		expect(options).not.toHaveProperty('headerTitle');
		expect(options).not.toHaveProperty('headerRight');
	});

	it('re-fires setOptions when roomUpdate changes even though the room reference is stable', () => {
		mockTestStore = makeRoomStore({ roomUpdate: { topic: 'old' } });

		renderHook(() => useHeader());
		expect(mockSetOptions).toHaveBeenCalledTimes(1);

		act(() => {
			mockTestStore.setState({ roomUpdate: { topic: 'new' } });
		});
		expect(mockSetOptions).toHaveBeenCalledTimes(2);
	});

	it('renders each header callback without throwing', () => {
		renderHook(() => useHeader());

		const options = mockSetOptions.mock.calls[0][0];
		expect(() => options.headerLeft()).not.toThrow();
		expect(() => options.headerTitle()).not.toThrow();
		expect(() => options.headerRight()).not.toThrow();
	});
});
