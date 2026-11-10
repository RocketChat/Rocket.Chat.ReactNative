import { callControlFeatureList } from '@rocket.chat/media-signaling';
import type { CallFeature, CallService } from '@rocket.chat/media-signaling';

/** Features this client implements; the server drops any other feature from calls this session places, accepts or takes over. */
export const CLIENT_SUPPORTED_FEATURES: CallFeature[] = ['audio', 'hold', 'conference-escalation', 'dialpad'];

/**
 * The features the call UI should treat as available, like web: only `cti` calls choose their control buttons;
 * on any other call those controls are always available.
 */
export const deriveSupportedFeatures = (service: CallService | null, features: readonly CallFeature[]): CallFeature[] => {
	if (service === 'cti') {
		return [...features];
	}

	return [...new Set([...features, ...callControlFeatureList])];
};
