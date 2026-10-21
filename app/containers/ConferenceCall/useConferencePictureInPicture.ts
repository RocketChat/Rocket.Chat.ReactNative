import { useEffect } from 'react';

import {
	onConferencePictureInPictureChanged,
	setConferencePictureInPictureEnabled
} from '~/lib/services/conference/conferencePictureInPicture';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';

export const useConferencePictureInPicture = (eligible: boolean): boolean => {
	const inPictureInPicture = useConferenceCallStore(state => state.pictureInPicture);
	const setPictureInPicture = useConferenceCallStore(state => state.setPictureInPicture);

	useEffect(() => {
		if (!eligible) {
			return;
		}
		setConferencePictureInPictureEnabled(true);
		const subscription = onConferencePictureInPictureChanged(setPictureInPicture);
		return () => {
			subscription.remove();
			setConferencePictureInPictureEnabled(false);
			setPictureInPicture(false);
		};
	}, [eligible, setPictureInPicture]);

	return inPictureInPicture;
};
