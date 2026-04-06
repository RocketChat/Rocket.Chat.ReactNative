import { useCallStore } from './useCallStore';

/** When true, incoming direct videoconf "call" handling should no-op (VoIP already active or native accept not yet bound). */
export function voipBlocksIncomingVideoconf(): boolean {
	const { call, nativeAcceptedCallId } = useCallStore.getState();
	return call != null || nativeAcceptedCallId != null;
}
