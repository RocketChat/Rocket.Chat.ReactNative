import { showActionSheetRef } from '~/containers/ActionSheet';
import { NewMediaCall } from '~/containers/NewMediaCall';
import { usePeerAutocompleteStore } from '~/lib/services/voip/usePeerAutocompleteStore';
import { useIsInActiveVoipCall } from '~/lib/services/voip/isInActiveVoipCall';
import { isSelfUserId } from '~/lib/services/voip/isSelfUserId';

interface IMediaCallPeer {
	userId: string;
	name: string;
	username: string;
}

export const useStartMediaCall = ({ userId, name, username }: IMediaCallPeer) => {
	const isInActiveCall = useIsInActiveVoipCall();
	const isSelf = isSelfUserId(userId);

	return () => {
		if (!userId || isInActiveCall || isSelf) return;
		usePeerAutocompleteStore.getState().setSelectedPeer({ type: 'user', value: userId, label: name, username });
		showActionSheetRef({
			children: <NewMediaCall />,
			portraitSnaps: ['60%'],
			landscapeSnaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	};
};
