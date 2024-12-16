import { compareServerVersion } from '../../methods/helpers';
import { useAppSelector } from '../../hooks';
import { TSubscriptionModel } from '../../../definitions';

const isMissingRoomE2EEKey = ({
	encryptionEnabled,
	roomEncrypted,
	E2EKey
}: {
	encryptionEnabled: boolean;
	roomEncrypted: TSubscriptionModel['encrypted'];
	E2EKey: TSubscriptionModel['E2EKey'];
}) => (encryptionEnabled && roomEncrypted && !E2EKey) ?? false;

const isE2EEDisabledEncryptedRoom = ({
	encryptionEnabled,
	roomEncrypted
}: {
	encryptionEnabled: boolean;
	roomEncrypted: TSubscriptionModel['encrypted'];
}) => (!encryptionEnabled && roomEncrypted) ?? false;

export const useIsMissingRoomE2EEKey = (roomEncrypted: TSubscriptionModel['encrypted'], E2EKey: TSubscriptionModel['E2EKey']) => {
	const serverVersion = useAppSelector(state => state.server.version);
	const e2eeEnabled = useAppSelector(state => state.settings.E2E_Enable);
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	if (!e2eeEnabled) {
		return false;
	}
	if (compareServerVersion(serverVersion, 'lowerThan', '6.10.0')) {
		return false;
	}

	return isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted, E2EKey });
};

export const useHasE2EEWarning = (roomEncrypted: TSubscriptionModel['encrypted'], E2EKey: TSubscriptionModel['E2EKey']) => {
	const serverVersion = useAppSelector(state => state.server.version);
	const e2eeEnabled = useAppSelector(state => state.settings.E2E_Enable);
	const encryptionEnabled = useAppSelector(state => state.encryption.enabled);
	if (!e2eeEnabled) {
		return false;
	}
	if (compareServerVersion(serverVersion, 'lowerThan', '6.10.0')) {
		return false;
	}

	return (
		isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted, E2EKey }) ||
		isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted })
	);
};
