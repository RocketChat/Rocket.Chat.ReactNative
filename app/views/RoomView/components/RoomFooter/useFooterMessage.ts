import I18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useSetting } from '../../../../lib/hooks/useSetting';
import { isBlocked } from '../../../../lib/methods/helpers/room';
import { isRoomFederated, isRoomNativeFederated } from '../../../../lib/methods/isRoomFederated';
import { useReadOnly } from '../../hooks/useReadOnly';
import { useRoomStore } from '../../stores/RoomStoreContext';

const getFederatedFooterDescription = (
	isNativeFederated: boolean,
	isFederationEnabled: boolean,
	isFederationModuleEnabled: boolean
): string | undefined => {
	if (!isNativeFederated) {
		return I18n.t('Federation_Matrix_room_description_invalid_version');
	}
	if (!isFederationEnabled) {
		return I18n.t('Federation_Matrix_room_description_disabled');
	}
	if (!isFederationModuleEnabled) {
		return I18n.t('Federation_Matrix_room_description_missing_module');
	}
	return undefined;
};

export const useFooterMessage = (): string | null => {
	const readOnly = useReadOnly();
	const isRoomBlocked = useRoomStore(s => isBlocked(s.room));
	const isFederated = useRoomStore(s => 'id' in s.room && isRoomFederated(s.room));
	const isNativeFederated = useRoomStore(s => 'id' in s.room && isRoomNativeFederated(s.room));
	const federationMatrixEnabled = useSetting('Federation_Matrix_enabled');
	const federationServiceEnabled = useSetting('Federation_Service_Enabled');
	const isFederationEnabled = !!(federationMatrixEnabled || federationServiceEnabled);
	const isFederationModuleEnabled = useAppSelector(state => state.enterpriseModules.includes('federation'));

	if (readOnly) {
		return I18n.t('This_room_is_read_only');
	}
	if (isRoomBlocked) {
		return I18n.t('This_room_is_blocked');
	}
	if (isFederated) {
		return getFederatedFooterDescription(isNativeFederated, isFederationEnabled, isFederationModuleEnabled) ?? null;
	}
	return null;
};
