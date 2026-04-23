import React from 'react';
import { useWindowDimensions } from 'react-native';

import { NewMediaCall } from '../../../containers/NewMediaCall';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { isTablet } from '../../methods/helpers/deviceInfo';
import { usePeerAutocompleteStore } from '../../services/voip/usePeerAutocompleteStore';
import { useSubscription } from '../useSubscription';
import { useMediaCallPermission } from '../useMediaCallPermission';

export const useNewMediaCall = (rid?: string) => {
	const room = useSubscription(rid);
	const hasMediaCallPermission = useMediaCallPermission();
	const { width, height } = useWindowDimensions();
	const isLandscape = width > height;

	const openNewMediaCall = () => {
		if (room) {
			const otherUserId = getUidDirectMessage(room);
			if (otherUserId) {
				usePeerAutocompleteStore.getState().setSelectedPeer({ type: 'user', value: otherUserId, label: room.name });
			}
		}
		// fullContainer forces a min inner height equal to the snap fraction of window height.
		// On iPad or iPhone landscape the sheet should hug its content instead.
		const fullContainer = !isTablet && !isLandscape;
		showActionSheetRef({
			children: <NewMediaCall />,
			portraitSnaps: ['60%'],
			landscapeSnaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer
		});
	};

	return { openNewMediaCall, hasMediaCallPermission };
};
