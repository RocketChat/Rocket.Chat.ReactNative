import React from 'react';

import { NewMediaCall } from '../../../containers/NewMediaCall';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { usePeerAutocompleteStore } from '../../services/voip/usePeerAutocompleteStore';
import { useIsInActiveVoipCall } from '../../services/voip/isInActiveVoipCall';
import { useSubscription } from '../useSubscription';
import { useMediaCallPermission } from '../useMediaCallPermission';

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
			portraitSnaps: ['60%'],
			landscapeSnaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	};

	return { openNewMediaCall, hasMediaCallPermission, isInActiveCall };
};
