import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type RoomState, type RoomStore } from '../../definitions';
import { useE2EEStatus } from '../useE2EEStatus';

let mockState = {
	server: { version: '7.0.0' },
	settings: { E2E_Enable: true },
	encryption: { enabled: true }
};
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState)
}));
jest.mock('../../../../lib/store/auxStore', () => ({ store: { getState: () => mockState } }));
jest.mock('@rocket.chat/mobile-crypto', () => ({}));

const createRoomStore = (room: RoomState['room']) => createStore(() => ({ room })) as RoomStore;

describe('useE2EEStatus', () => {
	beforeEach(() => {
		mockState = { server: { version: '7.0.0' }, settings: { E2E_Enable: true }, encryption: { enabled: true } };
	});

	it('does not warn for a preview Room without an encrypted field', () => {
		const store = createRoomStore({ rid: 'rid-1', t: 'c' });

		expect(renderHook(() => useE2EEStatus(store)).result.current).toEqual({
			showMissingE2EEKey: false,
			showE2EEDisabledRoom: false,
			hasE2EEWarning: false
		});
	});

	it.each([
		[true, true, undefined, true, false],
		[true, true, 'key', false, false],
		[false, true, 'key', false, true],
		[true, false, undefined, false, false],
		[false, false, undefined, false, false]
	])(
		'derives warnings with session encryption %s, Room encryption %s and key %s',
		(enabled, encrypted, E2EKey, missing, disabled) => {
			mockState.encryption.enabled = enabled;
			const room = { rid: 'rid-1', t: 'c', encrypted, E2EKey };
			const store = createRoomStore(room);

			expect(renderHook(() => useE2EEStatus(store)).result.current).toEqual({
				showMissingE2EEKey: missing,
				showE2EEDisabledRoom: disabled,
				hasE2EEWarning: missing || disabled
			});
		}
	);

	it('clears the missing-key warning when the same Room receives its key', () => {
		const room = { rid: 'rid-1', t: 'c', encrypted: true, E2EKey: undefined as string | undefined };
		const store = createRoomStore(room);
		const { result } = renderHook(() => useE2EEStatus(store));
		expect(result.current.hasE2EEWarning).toBe(true);

		act(() => {
			const updatedRoom = { ...room, E2EKey: 'key' };
			store.setState({ room: updatedRoom });
		});

		expect(result.current).toEqual({ showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false });
	});
});
