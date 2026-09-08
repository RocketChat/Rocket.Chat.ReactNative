import { create } from 'zustand';

type TConferenceCall = {
	callId?: string;
	url?: string;
	expanded: boolean;
	open: (call: { callId: string; url: string }) => void;
	expand: () => void;
	minimize: () => void;
	close: () => void;
};

export const useConferenceCallStore = create<TConferenceCall>(set => ({
	callId: undefined,
	url: undefined,
	expanded: false,

	open: ({ callId, url }) =>
		set(current => {
			if (current.callId === callId) {
				return { expanded: true };
			}

			return { callId, url, expanded: true };
		}),

	expand: () => set(current => (current.callId ? { expanded: true } : current)),

	minimize: () => set({ expanded: false }),

	close: () => set({ callId: undefined, url: undefined, expanded: false })
}));
