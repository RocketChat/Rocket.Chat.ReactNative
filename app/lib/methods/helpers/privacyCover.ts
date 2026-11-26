import NativePrivacyCover from '~/lib/native/NativePrivacyCover';

let latestClaimedToken: number | null = null;

export const setPrivacyCoverEnabled = (enabled: boolean): void => {
	NativePrivacyCover?.setEnabled(enabled);
};

export const claimPrivacyCover = (): number | null => {
	latestClaimedToken = NativePrivacyCover?.getCoverToken() ?? null;
	return latestClaimedToken;
};

export const releasePrivacyCover = (token: number | null = latestClaimedToken): void => {
	if (token === null) {
		return;
	}
	NativePrivacyCover?.releaseCover(token);
};
