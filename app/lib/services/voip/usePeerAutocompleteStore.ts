import { create } from 'zustand';

import { getPeerAutocompleteOptions, type TPeerInfo, type TPeerItem } from './getPeerAutocompleteOptions';

type TPeerAutocompleteState = {
	options: TPeerItem[];
	selectedPeer: TPeerItem | null;
	filter: string;
};

type TPeerAutocompleteActions = {
	fetchOptions: (filter: string) => Promise<void>;
	setSelectedPeer: (peer: TPeerItem | null) => void;
	setFilter: (filter: string) => void;
	clearSelection: () => void;
};

export type TPeerAutocompleteStore = TPeerAutocompleteState & TPeerAutocompleteActions;

export const usePeerAutocompleteStore = create<TPeerAutocompleteStore>((set, get) => ({
	options: [],
	selectedPeer: null,
	filter: '',

	fetchOptions: async (filter: string) => {
		const term = filter.trim();
		if (!term) {
			set({ options: [] });
			return;
		}

		try {
			const currentPeer = get().selectedPeer;
			const options = await getPeerAutocompleteOptions({
				filter: term,
				peerInfo: currentPeer
			});

			set({ options });
		} catch {
			console.log('Failed to fetch options');
		}
	},

	setSelectedPeer: (peer: TPeerInfo | null) => {
		set({ selectedPeer: peer });
	},

	setFilter: (filter: string) => {
		set({ filter });
	},

	clearSelection: () => {
		set({ selectedPeer: null });
	}
}));
