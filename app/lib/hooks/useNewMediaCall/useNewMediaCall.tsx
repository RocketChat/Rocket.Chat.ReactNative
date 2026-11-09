import { NewMediaCall } from '~/containers/NewMediaCall';
import { showActionSheetRef } from '~/containers/ActionSheet';
import { getUidDirectMessage } from '~/lib/methods/helpers/helpers';
import { usePeerAutocompleteStore } from '~/lib/services/voip/usePeerAutocompleteStore';
import { useIsInAnyCall } from '~/lib/services/isInAnyCall';
import { useSubscription } from '../useSubscription';
import { useMediaCallPermission } from '../useMediaCallPermission';
import { isAndroid } from '~/lib/methods/helpers/deviceInfo';

export const useNewMediaCall = (rid?: string) => {
	const room = useSubscription(rid);
	const hasMediaCallPermission = useMediaCallPermission();
	const isInActiveCall = useIsInAnyCall();

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

	return { openNewMediaCall, hasMediaCallPermission, isInActiveCall };
};
