export type NativeAcceptStoreSlice = {
	call: unknown;
	callId: string | null;
	nativeAcceptedCallId: string | null;
};

/**
 * Id used for guarded answer when no call object is bound yet.
 * Workspace is expected to match via `deepLinkingOpen({ host })`; signaling `callId` disambiguates.
 */
export function getEffectiveNativeAcceptedCallId(state: NativeAcceptStoreSlice): string | null {
	if (state.call != null) {
		return null;
	}
	return state.callId ?? state.nativeAcceptedCallId;
}
