import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type RoomState, type RoomStore } from '../../definitions';
import { useHeader } from '../useHeader';

let mockTestStore: RoomStore;

jest.mock('../useGoRoomActionsView', () => ({ useGoRoomActionsView: jest.fn(() => jest.fn()) }));
jest.mock('../../components/LeftButtons', () => ({ __esModule: true, default: 'LeftButtons' }));
jest.mock('../../components/RightButtons/RightButtons', () => ({ __esModule: true, default: 'RightButtons' }));
jest.mock('../../../../containers/RoomHeader', () => ({ __esModule: true, default: 'RoomHeader' }));
jest.mock('../../../../lib/methods/helpers', () => ({
	getRoomTitle: jest.fn(() => 'Room Title'),
	isGroupChat: jest.fn(() => false)
}));
jest.mock('../../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions };

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));

const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c', name: 'general' },
		roomUpdate: {},
		joined: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		lastMessageFromAgent: false,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve()),
		...overrides
	}));

describe('useHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockTestStore = makeRoomStore();
	});

	it('sets only the headerLeft spacer and returns when rid is missing', () => {
		renderHook(() => useHeader({ rid: undefined, tmid: undefined, name: 'general', roomStore: mockTestStore }));

		expect(mockSetOptions).toHaveBeenCalledTimes(1);
		const options = mockSetOptions.mock.calls[0][0];
		expect(typeof options.headerLeft).toBe('function');
		expect(options).not.toHaveProperty('headerTitle');
		expect(options).not.toHaveProperty('headerRight');
	});

	it('re-fires the title effect when a selected field changes on a re-emitted room', () => {
		mockTestStore = makeRoomStore({
			room: { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general', topic: 'old' } as RoomState['room']
		});

		renderHook(() => useHeader({ rid: 'rid-1', tmid: undefined, name: 'general', roomStore: mockTestStore }));
		expect(mockSetOptions).toHaveBeenCalledTimes(2);

		act(() => {
			mockTestStore.setState({ room: { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general', topic: 'new' } as RoomState['room'] });
		});
		expect(mockSetOptions).toHaveBeenCalledTimes(3);
		expect(mockSetOptions.mock.calls[2][0]).toHaveProperty('headerTitle');
		expect(mockSetOptions.mock.calls[2][0].headerTitle().props.subtitle).toBe('new');
	});

	it('keeps the thread title from the passed name when the observed room name changes', () => {
		renderHook(() => useHeader({ rid: 'rid-1', tmid: 'tmid-1', name: 'Thread name', roomStore: mockTestStore }));

		const titleOptions = mockSetOptions.mock.calls[1][0];
		expect(titleOptions.headerTitle().props.title).toBe('Thread name');

		act(() => {
			mockTestStore.setState({ room: { rid: 'rid-1', t: 'c', name: 'parent-channel' } });
		});
		const nextTitleOptions = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0];
		expect(nextTitleOptions.headerTitle().props.title).toBe('Thread name');
	});

	it('renders each header callback without throwing', () => {
		renderHook(() => useHeader({ rid: 'rid-1', tmid: undefined, name: 'general', roomStore: mockTestStore }));

		const sideOptions = mockSetOptions.mock.calls[0][0];
		const titleOptions = mockSetOptions.mock.calls[1][0];
		expect(() => sideOptions.headerLeft()).not.toThrow();
		expect(() => titleOptions.headerTitle()).not.toThrow();
		expect(() => sideOptions.headerRight()).not.toThrow();
	});
});
