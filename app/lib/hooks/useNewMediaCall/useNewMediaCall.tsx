import { NewMediaCall } from '~/containers/NewMediaCall';
import { showActionSheetRef } from '~/containers/ActionSheet';
import { getUidDirectMessage } from '~/lib/methods/helpers/helpers';
import { usePeerAutocompleteStore } from '~/lib/services/voip/usePeerAutocompleteStore';
import { useIsInActiveVoipCall } from '~/lib/services/voip/isInActiveVoipCall';
import { mediaSessionInstance } from '~/lib/services/voip/MediaSessionInstance';
import { isSelfUserId } from '~/lib/services/voip/isSelfUserId';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import I18n from '~/i18n';
import { useSubscription } from '../useSubscription';
import { useMediaCallPermission } from '../useMediaCallPermission';
import { isAndroid } from '~/lib/methods/helpers/deviceInfo';

export const useNewMediaCall = (rid?: string) => {
	const room = useSubscription(rid);
	const hasMediaCallPermission = useMediaCallPermission();
	const isInActiveCall = useIsInActiveVoipCall();

	const openNewMediaCall = () => {
		if (isInActiveCall) return;
		if (room) {
			const otherUserId = getUidDirectMessage(room);
			if (otherUserId) {
				usePeerAutocompleteStore.getState().setSelectedPeer({ type: 'user', value: otherUserId, label: room.name });
			}
		}
		showActionSheetRef({
			children: <NewMediaCall />,
			hugContent: isAndroid
		});
	};

	const startCallImmediate = async () => {
		if (isInActiveCall) return;
		const otherUserId = room ? getUidDirectMessage(room) : undefined;
		if (!otherUserId || isSelfUserId(otherUserId)) {
			openNewMediaCall();
			return;
		}
		try {
			await mediaSessionInstance.startCall(otherUserId, 'user');
		} catch (e) {
			const message = e instanceof Error && e.message ? e.message : I18n.t('VoIP_Call_Issue');
			showErrorAlert(message, I18n.t('Oops'));
		}
	};

	return { openNewMediaCall, startCallImmediate, hasMediaCallPermission, isInActiveCall };
};
