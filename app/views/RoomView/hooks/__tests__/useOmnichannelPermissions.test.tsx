import { renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { usePermissions } from '../../../../lib/hooks/usePermissions';
import { type RoomState, type RoomStore } from '../../definitions';
import { useOmnichannelPermissions } from '../useOmnichannelPermissions';

jest.mock('../../../../lib/hooks/usePermissions', () => ({
	usePermissions: jest.fn()
}));

const mockUsePermissions = usePermissions as jest.Mock;

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'l' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		lastMessageFromAgent: false,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve())
	}));

describe('useOmnichannelPermissions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('publishes the permission flags into the store for a livechat room', () => {
		mockUsePermissions.mockReturnValue([true, true]);
		const roomStore = makeRoomStore();

		renderHook(() => useOmnichannelPermissions({ rid: 'rid-1', t: 'l', roomStore }));

		expect(roomStore.getState().canForwardGuest).toBe(true);
		expect(roomStore.getState().canViewCannedResponse).toBe(true);
	});

	it('clears the flags when the room stops being a livechat room', () => {
		mockUsePermissions.mockReturnValue([true, true]);
		const roomStore = makeRoomStore();

		const { rerender } = renderHook(({ t }: { t: string }) => useOmnichannelPermissions({ rid: 'rid-1', t, roomStore }), {
			initialProps: { t: 'l' }
		});
		expect(roomStore.getState().canForwardGuest).toBe(true);

		rerender({ t: 'c' });

		expect(roomStore.getState().canForwardGuest).toBe(false);
		expect(roomStore.getState().canViewCannedResponse).toBe(false);
	});

	it('does not touch the flags for a non-livechat room', () => {
		mockUsePermissions.mockReturnValue([true, true]);
		const roomStore = makeRoomStore();

		renderHook(() => useOmnichannelPermissions({ rid: 'rid-1', t: 'c', roomStore }));

		expect(roomStore.getState().canForwardGuest).toBe(false);
		expect(roomStore.getState().canViewCannedResponse).toBe(false);
	});
});
