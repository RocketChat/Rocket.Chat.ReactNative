import I18n from '../../../../i18n';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { isBlocked } from '../../../../lib/methods/helpers/room';
import { type IRoomFederated, isRoomFederated, isRoomNativeFederated } from '../../../../lib/methods/isRoomFederated';
import { useReadOnly } from '../../hooks/useReadOnly';
import { useRoomWithUpdate } from '../../stores/RoomStoreContext';

const getFederatedFooterDescription = (
	federatedRoom: IRoomFederated,
	isFederationEnabled: boolean,
	isFederationModuleEnabled: boolean
): string | undefined => {
	if (!isRoomNativeFederated(federatedRoom)) {
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
	'use memo';

	const room = useRoomWithUpdate();
	const readOnly = useReadOnly();
	const isFederationEnabled = useAppSelector(
		state => (state.settings.Federation_Matrix_enabled || state.settings.Federation_Service_Enabled) as boolean
	);
	const isFederationModuleEnabled = useAppSelector(state => state.enterpriseModules.includes('federation'));

	if (readOnly) {
		return I18n.t('This_room_is_read_only');
	}
	if ('id' in room && isBlocked(room)) {
		return I18n.t('This_room_is_blocked');
	}
	if ('id' in room && isRoomFederated(room)) {
		return getFederatedFooterDescription(room, isFederationEnabled, isFederationModuleEnabled) ?? null;
	}
	return null;
};
