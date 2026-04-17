import { create } from 'zustand';

import { getPeerAutocompleteOptions, type TPeerAutocompleteAuth, type TPeerItem } from './getPeerAutocompleteOptions';

let peerAutocompleteFetchSeq = 0;

type TPeerAutocompleteState = {
	options: TPeerItem[];
	selectedPeer: TPeerItem | null;
	filter: string;
};

type TPeerAutocompleteActions = {
	fetchOptions: (filter: string, auth: TPeerAutocompleteAuth) => Promise<void>;
	setSelectedPeer: (peer: TPeerItem | null) => void;
	reset: () => void;
};

export type TPeerAutocompleteStore = TPeerAutocompleteState & TPeerAutocompleteActions;

export const usePeerAutocompleteStore = create<TPeerAutocompleteStore>((set, get) => ({
	options: [],
	selectedPeer: null,
	filter: '',

	fetchOptions: async (filter: string, auth: TPeerAutocompleteAuth) => {
		const term = filter.trim();
		if (!term) {
			set({ options: [] });
			return;
		}

		const peerSnapshot = get().selectedPeer;
		const seq = ++peerAutocompleteFetchSeq;

		try {
			const options = await getPeerAutocompleteOptions({
				filter: term,
				peerInfo: peerSnapshot,
				username: auth.username,
				sipEnabled: auth.sipEnabled
			});

			if (seq !== peerAutocompleteFetchSeq) {
				return;
			}
			if (get().filter.trim() !== term || get().selectedPeer !== peerSnapshot) {
				return;
			}

			set({ options });
		} catch {
			if (seq !== peerAutocompleteFetchSeq) {
				return;
			}
			if (get().filter.trim() === term && get().selectedPeer === peerSnapshot) {
				set({ options: [] });
			}
		}
	},

	setSelectedPeer: (peer: TPeerItem | null) => {
		if (peer === null) {
			set({ selectedPeer: null, options: [] });
			return;
		}
		set({ selectedPeer: peer, filter: '', options: [] });
	},

	reset: () => {
		peerAutocompleteFetchSeq++;
		set({ options: [], selectedPeer: null, filter: '' });
	}
}));
