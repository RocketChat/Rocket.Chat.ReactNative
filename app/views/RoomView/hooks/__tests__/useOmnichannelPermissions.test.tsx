import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { getRoutingConfig } from '../../../../lib/services/restApi';
import { usePermissions } from '../../../../lib/hooks/usePermissions';
import { type RoomState, type RoomStore } from '../../../../lib/store/definitions';
import { type IUseOmnichannelPermissionsParams } from '../useOmnichannelPermissions';
import { useOmnichannelPermissions } from '../useOmnichannelPermissions';

jest.mock('../../../../lib/services/restApi', () => ({
	getRoutingConfig: jest.fn()
}));
jest.mock('../../../../lib/hooks/usePermissions', () => ({
	usePermissions: jest.fn()
}));

const mockGetRoutingConfig = getRoutingConfig as jest.Mock;
const mockUsePermissions = usePermissions as jest.Mock;

const makeRoomStore = (lastMessageFromAgent = false): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'l' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		lastMessageFromAgent,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve())
	}));

const renderOmnichannelPermissions = (overrides: Partial<IUseOmnichannelPermissionsParams> = {}, roomStore = makeRoomStore()) => {
	const { result } = renderHook(() =>
		useOmnichannelPermissions({
			rid: 'rid-1',
			t: 'l',
			roomUpdate: {},
			joined: true,
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
		mockUsePermissions.mockReturnValue([true, true]);
		mockGetRoutingConfig.mockResolvedValue({ returnQueue: true });

		const { roomStore } = renderOmnichannelPermissions({ t: 'l', roomUpdate: { onHold: false } }, makeRoomStore(true));

		expect(roomStore.getState().canForwardGuest).toBe(true);
		expect(roomStore.getState().canViewCannedResponse).toBe(true);

		await waitFor(() => {
			expect(roomStore.getState().canReturnQueue).toBe(true);
		});

		expect(roomStore.getState().canPlaceLivechatOnHold).toBe(true);
	});

	it('does not touch the flags for a non-livechat room', async () => {
		mockUsePermissions.mockReturnValue([true, true]);

		const { roomStore } = renderOmnichannelPermissions({ t: 'c' });

		await act(async () => {});

		expect(mockGetRoutingConfig).not.toHaveBeenCalled();
		expect(roomStore.getState().canForwardGuest).toBe(false);
		expect(roomStore.getState().canReturnQueue).toBe(false);
		expect(roomStore.getState().canViewCannedResponse).toBe(false);
		expect(roomStore.getState().canPlaceLivechatOnHold).toBe(false);
	});

	it('drops a return-queue result that resolves after the screen unmounted', async () => {
		const roomStore = makeRoomStore();
		let resolveRoutingConfig: (value: { returnQueue: boolean }) => void = () => {};

		mockUsePermissions.mockReturnValue([true, true]);
		mockGetRoutingConfig.mockImplementation(
			() =>
				new Promise(resolve => {
					resolveRoutingConfig = resolve;
				})
		);

		const { unmount } = renderHook((props: IUseOmnichannelPermissionsParams) => useOmnichannelPermissions(props), {
			initialProps: {
				rid: 'rid-1',
				t: 'l',
				roomUpdate: {},
				joined: false,
				livechatAllowManualOnHold: true,
				roomStore
			}
		});

		unmount();
		resolveRoutingConfig({ returnQueue: true });
		await act(async () => {});

		expect(roomStore.getState().canReturnQueue).toBe(false);
	});

	it('fetches the server-global routing config once, not again when the room is joined', async () => {
		const roomStore = makeRoomStore();
		mockUsePermissions.mockReturnValue([true, true]);
		mockGetRoutingConfig.mockResolvedValue({ returnQueue: true });

		const baseProps: IUseOmnichannelPermissionsParams = {
			rid: 'rid-1',
			t: 'l',
			roomUpdate: {},
			joined: false,
			livechatAllowManualOnHold: true,
			roomStore
		};

		const { rerender } = renderHook((props: IUseOmnichannelPermissionsParams) => useOmnichannelPermissions(props), {
			initialProps: baseProps
		});

		await waitFor(() => {
			expect(roomStore.getState().canReturnQueue).toBe(true);
		});

		rerender({ ...baseProps, joined: true });
		await act(async () => {});

		expect(mockGetRoutingConfig).toHaveBeenCalledTimes(1);
	});

	it('recomputes canPlaceLivechatOnHold on a pure on-hold flip of the same room instance', async () => {
		const roomStore = makeRoomStore(true);
		mockUsePermissions.mockReturnValue([true, true]);
		mockGetRoutingConfig.mockResolvedValue({ returnQueue: true });

		const baseProps: IUseOmnichannelPermissionsParams = {
			rid: 'rid-1',
			t: 'l',
			roomUpdate: { onHold: false },
			joined: true,
			livechatAllowManualOnHold: true,
			roomStore
		};

		const { rerender } = renderHook((props: IUseOmnichannelPermissionsParams) => useOmnichannelPermissions(props), {
			initialProps: baseProps
		});

		await waitFor(() => {
			expect(roomStore.getState().canPlaceLivechatOnHold).toBe(true);
		});

		rerender({ ...baseProps, roomUpdate: { onHold: true } });

		await waitFor(() => {
			expect(roomStore.getState().canPlaceLivechatOnHold).toBe(false);
		});
	});
});
