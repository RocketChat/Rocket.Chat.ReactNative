import React from 'react';

import { NewMediaCall } from '../../../containers/NewMediaCall';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { usePeerAutocompleteStore } from '../../services/voip/usePeerAutocompleteStore';
import { useSubscription } from '../useSubscription';
import { useMediaCallPermission } from '../useMediaCallPermission';

export const useNewMediaCall = (rid: string) => {
	const room = useSubscription(rid);
	const hasMediaCallPermission = useMediaCallPermission();

	const openNewMediaCall = () => {
		if (!room) return;
		const otherUserId = getUidDirectMessage(room);
		if (!otherUserId) return;
		usePeerAutocompleteStore.getState().setSelectedPeer({ type: 'user', value: otherUserId, label: room.name });
		showActionSheetRef({
			children: <NewMediaCall />
		});
	};

	return { openNewMediaCall, hasMediaCallPermission };
};

export const useNewMediaCallWithoutRoom = () => {
	const hasMediaCallPermission = useMediaCallPermission();

	const openNewMediaCall = () => {
		showActionSheetRef({
			children: <NewMediaCall />
		});
	};

	return { openNewMediaCall, hasMediaCallPermission };
};
