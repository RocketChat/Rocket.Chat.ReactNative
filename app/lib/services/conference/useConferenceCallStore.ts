import { create } from 'zustand';

type TConferenceCall = {
	callId?: string;
	url?: string;
	server?: string;
	expanded: boolean;
	open: (call: { callId: string; url: string; rid?: string; server?: string }) => void;
	expand: () => void;
	minimize: () => void;
	close: () => void;
};

export const preflightCallId = (rid: string): string => `new:${rid}`;

export const useConferenceCallStore = create<TConferenceCall>(set => ({
	callId: undefined,
	url: undefined,
	server: undefined,
	expanded: false,

	open: ({ callId, url, rid, server }) =>
		set(current => {
			if (current.callId === callId && current.server === server) {
				return { expanded: true };
			}

			if (rid && current.url && current.callId === preflightCallId(rid) && current.server === server) {
				return { callId, url: current.url, expanded: true, server };
			}

			return { callId, url, expanded: true, server };
		}),

	expand: () => set(current => (current.callId ? { expanded: true } : current)),

	minimize: () => set({ expanded: false }),

	close: () => set({ callId: undefined, url: undefined, server: undefined, expanded: false })
}));
