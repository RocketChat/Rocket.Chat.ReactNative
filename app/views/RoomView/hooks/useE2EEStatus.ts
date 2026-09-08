import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { type IUseE2EEStatusResult } from '../definitions';
import { type RoomStore } from '../definitions';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { useRoomFromStore } from '../stores/RoomStoreContext';

const getE2EEStatus = (snapshot: RoomSnapshot, encryptionEnabled: boolean): IUseE2EEStatusResult => {
	const room = getRoom(snapshot);
	if (!('encrypted' in room)) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom, hasE2EEWarning: showMissingE2EEKey || showE2EEDisabledRoom };
};

export const useE2EEStatus = (roomStore: RoomStore): IUseE2EEStatusResult => {
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	const { snapshot } = useRoomFromStore(roomStore);

	return getE2EEStatus(snapshot, encryptionEnabled);
};
