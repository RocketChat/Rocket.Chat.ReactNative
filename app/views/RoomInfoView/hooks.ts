import { ISubscription } from '../../definitions';
import { hasE2EEWarning } from '../../lib/encryption/utils';
import { useAppSelector } from '../../lib/hooks';

export const useE2EEWarning = (room?: ISubscription): boolean => {
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	if (!room) {
		return false;
	}
	return hasE2EEWarning({
		encryptionEnabled,
		E2EKey: room.E2EKey,
		roomEncrypted: room.encrypted
	});
};
