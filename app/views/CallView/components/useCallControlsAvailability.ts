import { useCallFeature, useCallStore, useIsCallEscalated, useIsControlOnlyCall } from '~/lib/services/voip/useCallStore';

/** Which call controls are disabled, from the call state and the features the server enabled for the call. */
export const useCallControlsAvailability = () => {
	const callState = useCallStore(state => state.callState);
	const roomId = useCallStore(state => state.roomId);
	const escalated = useIsCallEscalated();
	const isControlOnly = useIsControlOnlyCall();
	const holdAvailable = useCallFeature('hold');
	const muteAvailable = useCallFeature('mute');
	const dialpadAvailable = useCallFeature('dialpad');
	const directMessageAvailable = useCallFeature('direct-message');

	const isConnecting = callState === 'none' || callState === 'ringing' || callState === 'accepted';

	return {
		isConnecting,
		// A `cti` call's audio plays on the external device, not on this phone
		speakerDisabled: callState === 'none' || isControlOnly,
		holdDisabled: isConnecting || escalated || !holdAvailable,
		muteDisabled: isConnecting || !muteAvailable,
		dialpadDisabled: isConnecting || !dialpadAvailable,
		messageDisabled: roomId == null || !directMessageAvailable
	};
};
