import { create } from 'zustand';

type TConferenceCall = {
	callId?: string;
	url?: string;
	expanded: boolean;
	open: (call: { callId: string; url: string; rid?: string }) => void;
	expand: () => void;
	minimize: () => void;
	close: () => void;
};

export const preflightCallId = (rid: string): string => `new:${rid}`;

export const useConferenceCallStore = create<TConferenceCall>(set => ({
	callId: undefined,
	url: undefined,
	expanded: false,

	open: ({ callId, url, rid }) =>
		set(current => {
			if (current.callId === callId) {
				return { expanded: true };
			}

			// Starting a call from a room loads a preflight page keyed by that room; once the server
			// assigns the real callId, only that room may claim the page instead of reloading it.
			if (rid && current.url && current.callId === preflightCallId(rid)) {
				return { callId, url: current.url, expanded: true };
			}

			return { callId, url, expanded: true };
		}),

	expand: () => set(current => (current.callId ? { expanded: true } : current)),

	minimize: () => set({ expanded: false }),

	close: () => set({ callId: undefined, url: undefined, expanded: false })
}));
