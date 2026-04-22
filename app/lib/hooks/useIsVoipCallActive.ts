import { useShallow } from 'zustand/react/shallow';

import { useCallStore } from '../services/voip/useCallStore';

/** Returns true when a VoIP call is active (either ringing/accepted natively or fully connected). */
export const useIsVoipCallActive = () =>
	useCallStore(useShallow(state => state.call != null || state.nativeAcceptedCallId != null));
