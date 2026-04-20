import { create } from 'zustand';

import { getPeerAutocompleteOptions, type TPeerAutocompleteAuth, type TPeerItem } from './getPeerAutocompleteOptions';

type TPeerAutocompleteState = {
	options: TPeerItem[];
	selectedPeer: TPeerItem | null;
	filter: string;
};

type TPeerAutocompleteActions = {
	fetchOptions: (filter: string, auth: TPeerAutocompleteAuth) => Promise<void>;
	setFilter: (filter: string) => void;
	setSelectedPeer: (peer: TPeerItem | null) => void;
	reset: () => void;
};

export type TPeerAutocompleteStore = TPeerAutocompleteState & TPeerAutocompleteActions;

export const usePeerAutocompleteStore = create<TPeerAutocompleteStore>((set, get) => {
	let seq = 0;

	return {
		options: [],
		selectedPeer: null,
		filter: '',

		fetchOptions: async (filter: string, auth: TPeerAutocompleteAuth) => {
			const currentSeq = ++seq;
			const term = filter.trim();
			if (!term) {
				set({ options: [] });
				return;
			}

			const peerSnapshot = get().selectedPeer;

			try {
				const options = await getPeerAutocompleteOptions({
					filter: term,
					peerInfo: peerSnapshot,
					username: auth.username,
					sipEnabled: auth.sipEnabled
				});

				if (currentSeq !== seq) {
					return;
				}

				set({ options });
			} catch {
				if (currentSeq !== seq) {
					return;
				}
				set({ options: [] });
			}
		},

		setFilter: (filter: string) => {
			seq++;
			set({ filter, selectedPeer: null, options: [] });
		},

		setSelectedPeer: (peer: TPeerItem | null) => {
			if (peer === null) {
				set({ selectedPeer: null, options: [] });
				return;
			}
			set({ selectedPeer: peer, filter: '', options: [] });
		},

		reset: () => {
			seq++;
			set({ options: [], selectedPeer: null, filter: '' });
		}
	};
});
