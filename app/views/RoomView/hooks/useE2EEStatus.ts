import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { type IUseE2EEStatusResult } from '../definitions';
import { type RoomStore } from '../definitions';
import { useRoomWithUpdateFromStore } from '../stores/RoomStoreContext';

// The store is supplied by the owning RoomView, including to native-stack header callbacks.
export const useE2EEStatus = (roomStore: RoomStore): IUseE2EEStatusResult => {
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	const room = useRoomWithUpdateFromStore(roomStore);

	if (!('encrypted' in room)) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom };
};
