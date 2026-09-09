import { useStore } from 'zustand';

import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../../lib/encryption/utils';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { type IUseE2EEStatusResult, type RoomStore } from '../definitions';

export const useE2EEStatus = (roomStore: RoomStore): IUseE2EEStatusResult => {
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	const encrypted = useStore(roomStore, s => ('encrypted' in s.room ? s.room.encrypted : undefined));
	const E2EKey = useStore(roomStore, s => ('E2EKey' in s.room ? s.room.E2EKey : undefined));

	if (encrypted === undefined) {
		return { showMissingE2EEKey: false, showE2EEDisabledRoom: false, hasE2EEWarning: false };
	}

	const showMissingE2EEKey = isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: encrypted, E2EKey });
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: encrypted });

	return { showMissingE2EEKey, showE2EEDisabledRoom, hasE2EEWarning: showMissingE2EEKey || showE2EEDisabledRoom };
};
