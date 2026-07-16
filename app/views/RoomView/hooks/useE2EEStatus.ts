import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { type IUseE2EEStatusResult, type RoomStore } from '../definitions';
import { peekRoomStore } from '../stores/RoomStore';
import { useRoomWithUpdateFromStore } from '../stores/RoomStoreContext';

// Callers in the native-stack header render outside RoomView's provider, so they resolve the store
// by rid from the module registry; the orchestrator can pass its store instance explicitly instead.
export const useE2EEStatus = (rid?: string, roomStoreOverride?: RoomStore): IUseE2EEStatusResult => {
	'use memo';

	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	const room = useRoomWithUpdateFromStore(roomStoreOverride ?? peekRoomStore(rid));

	if (!('encrypted' in room)) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom };
};
