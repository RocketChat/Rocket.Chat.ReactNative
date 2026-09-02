import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { peekRoomStore } from '../stores/RoomStore';
import { useRoomWithUpdateFromStore } from '../../../lib/store/RoomStoreContext';

export interface IUseE2EEStatusResult {
	showMissingE2EEKey: boolean;
	showE2EEDisabledRoom: boolean;
}

// Callers render outside RoomView's provider — the native-stack header, and the orchestrator that
// renders the provider itself — so they resolve the store by rid from the module registry.
export const useE2EEStatus = (rid?: string): IUseE2EEStatusResult => {
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	const room = useRoomWithUpdateFromStore(peekRoomStore(rid));

	if (!('encrypted' in room)) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom };
};
