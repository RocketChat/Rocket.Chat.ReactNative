import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { getRoutingConfig } from '../../../lib/services/restApi';
import { hasPermission } from '../../../lib/methods/helpers';
import { type RoomState, type RoomStore } from '../stores/RoomStore';
import { useOmnichannelPermissions, type IUseOmnichannelPermissionsParams } from './useOmnichannelPermissions';

jest.mock('../../../lib/services/restApi', () => ({
	getRoutingConfig: jest.fn()
}));
jest.mock('../../../lib/methods/helpers', () => ({
	hasPermission: jest.fn()
}));

const mockGetRoutingConfig = getRoutingConfig as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'l' },
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
		markMessageSent: jest.fn()
	}));

const renderOmnichannelPermissions = (overrides: Partial<IUseOmnichannelPermissionsParams> = {}, roomStore = makeRoomStore()) => {
	const { result } = renderHook(() =>
		useOmnichannelPermissions({
			rid: 'rid-1',
			t: 'l',
			room: { rid: 'rid-1', t: 'l' },
			roomUpdate: {},
			joined: true,
			transferLivechatGuestPermission: ['transfer-livechat-guest'],
			viewCannedResponsesPermission: ['view-canned-responses'],
			livechatAllowManualOnHold: true,
			roomStore,
			...overrides
		})
	);

	return { result, roomStore };
};

describe('useOmnichannelPermissions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('publishes the four flags into the store for a livechat room', async () => {
		mockHasPermission.mockResolvedValue([true]);
		mockGetRoutingConfig.mockResolvedValue({ returnQueue: true });

		const { roomStore } = renderOmnichannelPermissions({
			t: 'l',
			room: { rid: 'rid-1', t: 'l', lastMessage: { token: undefined, u: { _id: 'u1' } }, onHold: false } as any
		});

		await waitFor(() => {
			expect(roomStore.getState().canForwardGuest).toBe(true);
		});

		expect(roomStore.getState().canReturnQueue).toBe(true);
		expect(roomStore.getState().canViewCannedResponse).toBe(true);
		expect(roomStore.getState().canPlaceLivechatOnHold).toBe(true);
	});

	it('does not touch the flags for a non-livechat room', async () => {
		const { roomStore } = renderOmnichannelPermissions({ t: 'c', room: { rid: 'rid-1', t: 'c' } as any });

		await Promise.resolve();

		expect(mockHasPermission).not.toHaveBeenCalled();
		expect(mockGetRoutingConfig).not.toHaveBeenCalled();
		expect(roomStore.getState().canForwardGuest).toBe(false);
		expect(roomStore.getState().canReturnQueue).toBe(false);
		expect(roomStore.getState().canViewCannedResponse).toBe(false);
		expect(roomStore.getState().canPlaceLivechatOnHold).toBe(false);
	});

	it('discards a superseded batch that resolves after a fresher one', async () => {
		const roomStore = makeRoomStore();
		let resolveFirstRoutingConfig: (value: { returnQueue: boolean }) => void = () => {};

		mockHasPermission.mockResolvedValue([false]);
		mockGetRoutingConfig.mockImplementationOnce(
			() =>
				new Promise(resolve => {
					resolveFirstRoutingConfig = resolve;
				})
		);

		const baseProps: IUseOmnichannelPermissionsParams = {
			rid: 'rid-1',
			t: 'l',
			room: { rid: 'rid-1', t: 'l' } as any,
			roomUpdate: {},
			joined: false,
			transferLivechatGuestPermission: ['transfer-livechat-guest'],
			viewCannedResponsesPermission: ['view-canned-responses'],
			livechatAllowManualOnHold: true,
			roomStore
		};

		const { rerender } = renderHook((props: IUseOmnichannelPermissionsParams) => useOmnichannelPermissions(props), {
			initialProps: baseProps
		});

		mockHasPermission.mockResolvedValue([true]);
		mockGetRoutingConfig.mockResolvedValue({ returnQueue: true });

		rerender({ ...baseProps, joined: true });

		await waitFor(() => {
			expect(roomStore.getState().canForwardGuest).toBe(true);
		});

		resolveFirstRoutingConfig({ returnQueue: false });
		await act(async () => {});

		expect(roomStore.getState().canForwardGuest).toBe(true);
		expect(roomStore.getState().canReturnQueue).toBe(true);
		expect(roomStore.getState().canViewCannedResponse).toBe(true);
	});
});
