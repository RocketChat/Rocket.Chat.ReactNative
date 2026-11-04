import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { useVideoConf } from '~/lib/hooks/useVideoConf';

export const useHeaderCallPress = (rid: string) => {
	const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const { openNewMediaCall, hasMediaCallPermission, isInActiveCall } = useNewMediaCall(rid);

	if (hasMediaCallPermission) {
		return {
			callPresent: true,
			isCallDisabled: isInActiveCall,
			onPressCall: openNewMediaCall
		};
	}

	if (callEnabled) {
		return {
			callPresent: true,
			isCallDisabled: disabledTooltip || isInActiveCall,
			onPressCall: showInitCallActionSheet
		};
	}

	return {
		callPresent: false,
		isCallDisabled: true,
		onPressCall: () => {}
	};
};
