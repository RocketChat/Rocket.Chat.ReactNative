import { useCallback, useRef } from 'react';

import NativePrivacyCover from '~/lib/native/NativePrivacyCover';

type TLockScreenPhase = 'hidden' | 'fadingIn' | 'shown';

const releaseActivePrivacyCover = () => NativePrivacyCover.releaseCover(NativePrivacyCover.getCoverToken());

export const useLockScreenPrivacyCover = () => {
	const phase = useRef<TLockScreenPhase>('hidden');
	const releaseWhenShown = useRef(false);

	const onLockRequest = useCallback(() => {
		if (phase.current === 'shown') {
			releaseActivePrivacyCover();
			return;
		}
		if (phase.current === 'fadingIn') {
			releaseWhenShown.current = true;
			return;
		}
		phase.current = 'fadingIn';
	}, []);

	const onLockScreenShown = useCallback(() => {
		phase.current = 'shown';
		if (releaseWhenShown.current) {
			releaseWhenShown.current = false;
			releaseActivePrivacyCover();
		}
	}, []);

	const onLockScreenDismissed = useCallback(() => {
		phase.current = 'hidden';
		releaseWhenShown.current = false;
	}, []);

	return { onLockRequest, onLockScreenShown, onLockScreenDismissed, onUnlock: releaseActivePrivacyCover };
};
