import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';

export const useHeaderCallPress = (rid: string) => {
	const { openNewMediaCall, hasMediaCallPermission, isInActiveCall } = useNewMediaCall(rid);

	return {
		callPresent: hasMediaCallPermission,
		isCallDisabled: isInActiveCall,
		onPressCall: openNewMediaCall
	};
};
