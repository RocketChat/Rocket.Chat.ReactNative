import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { createStore } from 'zustand';

import { type RoomState, type RoomStore } from '~/views/RoomView/definitions';
import { useHeader } from '../useHeader';
import { useNativeRoomHeader } from '../useNativeRoomHeader';

jest.mock('../useNativeRoomHeader', () => ({ useNativeRoomHeader: jest.fn() }));
jest.mock('../useNativeBackButton', () => ({ useNativeBackButton: jest.fn() }));
const mockNativeRightItems: unknown[] = [];
jest.mock('../useRoomHeaderRightItems', () => ({ useRoomHeaderRightItems: jest.fn(() => mockNativeRightItems) }));

let mockTestStore: RoomStore;
let mockIsIOS = false;

jest.mock('../useGoRoomActionsView', () => ({ useGoRoomActionsView: jest.fn(() => jest.fn()) }));
jest.mock('~/views/RoomView/components/LeftButtons', () => ({ __esModule: true, default: 'LeftButtons' }));
jest.mock('~/views/RoomView/components/RightButtons/RightButtons', () => ({ __esModule: true, default: 'RightButtons' }));
jest.mock('~/containers/RoomHeader', () => ({ __esModule: true, default: 'RoomHeader' }));
let mockIsTablet = false;
jest.mock('~/lib/methods/helpers', () => ({
	getRoomTitle: jest.fn(() => 'Room Title'),
	isGroupChat: jest.fn(() => false),
	get isIOS() {
		return mockIsIOS;
	},
	get isTablet() {
		return mockIsTablet;
	},
	get hasNativeHeaderBar() {
		return mockIsIOS && !mockIsTablet;
	}
}));
jest.mock('~/lib/methods/isInviteSubscription', () => ({
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
		membership: 'subscribed',
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
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
		mockIsIOS = false;
		mockIsTablet = false;
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

	describe('on iOS', () => {
		beforeEach(() => {
			mockIsIOS = true;
		});

		it('renders the tappable RoomHeader under the native header bar', () => {
			renderHook(() => useHeader({ rid: 'rid-1', tmid: undefined, name: 'general', roomStore: mockTestStore }));

			const titleOptions = mockSetOptions.mock.calls[1][0];
			expect(typeof titleOptions.headerTitle).toBe('function');
			expect(titleOptions.headerTitle().props.title).toBe('Room Title');
		});

		it('sets unstable_headerRightItems and keeps the native back button instead of headerLeft/headerRight', () => {
			renderHook(() => useHeader({ rid: 'rid-1', tmid: undefined, name: 'general', roomStore: mockTestStore }));

			const sideOptions = mockSetOptions.mock.calls[0][0];
			expect(typeof sideOptions.unstable_headerRightItems).toBe('function');
			expect(sideOptions.unstable_headerRightItems()).toBe(mockNativeRightItems);
			expect(sideOptions).not.toHaveProperty('headerLeft');
			expect(sideOptions).not.toHaveProperty('headerRight');
		});
	});

	describe('on iPad', () => {
		beforeEach(() => {
			mockIsIOS = true;
			mockIsTablet = true;
		});

		it('renders the tappable RoomHeader instead of the native string title', () => {
			renderHook(() => useHeader({ rid: 'rid-1', tmid: undefined, name: 'general', roomStore: mockTestStore }));

			const titleOptions = mockSetOptions.mock.calls[1][0];
			expect(titleOptions).toHaveProperty('headerTitle');
			expect(typeof titleOptions.headerTitle).toBe('function');
		});
	});
});

describe('native title availability', () => {
	const originalVersion = Platform.Version;
	const originalOS = Platform.OS;
	afterEach(() => {
		Object.defineProperty(Platform, 'Version', { configurable: true, value: originalVersion });
		Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
	});

	it.each([
		['ios', '26.0', true],
		['ios', '18.0', false],
		['android', 36, false]
	])('uses the appropriate title on %s %s', (os, version, native) => {
		jest.clearAllMocks();
		Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
		Object.defineProperty(Platform, 'Version', { configurable: true, value: version });
		renderHook(() => useHeader({ rid: 'rid-1', roomStore: makeRoomStore() }));
		expect(useNativeRoomHeader).toHaveBeenCalledWith(native, expect.any(Object), undefined, null, expect.any(Function));
		expect(mockSetOptions.mock.calls.some(([options]) => typeof options.headerTitle === 'function')).toBe(!native);
	});
});
