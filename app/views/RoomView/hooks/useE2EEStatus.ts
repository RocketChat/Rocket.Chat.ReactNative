import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { type IUseE2EEStatusResult } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';

export const useE2EEStatus = (rid?: string): IUseE2EEStatusResult => {
	'use memo';

	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	const room = useRoomStoreByRid(rid, s => s.room);
	// The room model mutates in place; subscribing to `roomUpdate` (a fresh snapshot per emit)
	// is what re-runs this derivation when `encrypted`/`E2EKey` change.
	useRoomStoreByRid(rid, s => s.roomUpdate);

	if (!('encrypted' in room)) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom };
};
