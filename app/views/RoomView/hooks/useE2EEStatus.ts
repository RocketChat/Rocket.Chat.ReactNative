import { useStore } from 'zustand';

import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { type IUseE2EEStatusResult } from '../definitions';
import { type RoomStore } from '../stores/RoomStore';

// Only the orchestrator calls this in Phase 1, so `roomStore` is a required explicit param
// (no context indirection needed yet — `useHeader` gains its own call in a later phase).
export const useE2EEStatus = (roomStore: RoomStore, encryptionEnabled: boolean): IUseE2EEStatusResult => {
	'use memo';

	const room = useStore(roomStore, s => s.room);
	// The room model mutates in place; subscribing to `roomUpdate` (a fresh snapshot per emit)
	// is what re-runs this derivation when `encrypted`/`E2EKey` change.
	useStore(roomStore, s => s.roomUpdate);

	if (!('encrypted' in room)) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom };
};
