import { renderHook } from '@testing-library/react-native';

import { SubscriptionType } from '../../../definitions/ISubscription';
import { useHeader } from './useHeader';

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

const setOptions = jest.fn();
const navigation = { setOptions } as unknown as Parameters<typeof useHeader>[0]['navigation'];

const makeParams = (overrides: Partial<Parameters<typeof useHeader>[0]> = {}): Parameters<typeof useHeader>[0] => ({
	rid: 'rid-1',
	tmid: undefined,
	roomType: SubscriptionType.CHANNEL,
	roomName: 'general',
	room: { rid: 'rid-1', t: 'c', name: 'general' },
	roomUpdate: {},
	unreadsCount: null,
	roomUserId: null,
	joined: true,
	canForwardGuest: false,
	canReturnQueue: false,
	canPlaceLivechatOnHold: false,
	showMissingE2EEKey: false,
	showE2EEDisabledRoom: false,
	navigation,
	isMasterDetail: false,
	baseUrl: 'https://open.rocket.chat',
	user: { id: 'u1', username: 'user', token: 'tok', showMessageInMainThread: false },
	goRoomActionsView: jest.fn(),
	toggleFollowThread: jest.fn(() => Promise.resolve()),
	showActionSheet: jest.fn(),
	...overrides
});

describe('useHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('sets headerLeft, headerTitle and headerRight when rid and room.rid are present', () => {
		renderHook(() => useHeader(makeParams()));

		expect(setOptions).toHaveBeenCalledTimes(1);
		const options = setOptions.mock.calls[0][0];
		expect(typeof options.headerLeft).toBe('function');
		expect(typeof options.headerTitle).toBe('function');
		expect(typeof options.headerRight).toBe('function');
	});

	it('sets only the headerLeft spacer and returns when rid is missing', () => {
		renderHook(() => useHeader(makeParams({ rid: undefined })));

		expect(setOptions).toHaveBeenCalledTimes(1);
		const options = setOptions.mock.calls[0][0];
		expect(typeof options.headerLeft).toBe('function');
		expect(options).not.toHaveProperty('headerTitle');
		expect(options).not.toHaveProperty('headerRight');
	});

	it('does not call setOptions when room has no rid', () => {
		renderHook(() => useHeader(makeParams({ room: { rid: '', t: 'c' } })));

		expect(setOptions).not.toHaveBeenCalled();
	});

	it('re-fires setOptions when roomUpdate changes even though the room reference is stable', () => {
		const base = makeParams();
		const { rerender } = renderHook(
			({ roomUpdate }: { roomUpdate: Parameters<typeof useHeader>[0]['roomUpdate'] }) => useHeader({ ...base, roomUpdate }),
			{ initialProps: { roomUpdate: { topic: 'old' } } }
		);
		expect(setOptions).toHaveBeenCalledTimes(1);

		rerender({ roomUpdate: { topic: 'new' } });
		expect(setOptions).toHaveBeenCalledTimes(2);
	});

	it('renders each header callback without throwing', () => {
		renderHook(() => useHeader(makeParams()));

		const options = setOptions.mock.calls[0][0];
		expect(() => options.headerLeft()).not.toThrow();
		expect(() => options.headerTitle()).not.toThrow();
		expect(() => options.headerRight()).not.toThrow();
	});
});
