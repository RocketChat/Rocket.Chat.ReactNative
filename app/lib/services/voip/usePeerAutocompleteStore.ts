import { create } from 'zustand';

import { getPeerAutocompleteOptions, type TPeerInfo, type TPeerOption } from './getPeerAutocompleteOptions';

type TPeerAutocompleteState = {
	options: TPeerOption[];
	selectedPeer: TPeerInfo | null;
	filter: string;
};

type TPeerAutocompleteActions = {
	fetchOptions: (filter: string) => Promise<void>;
	setSelectedPeer: (peer: TPeerInfo | null) => void;
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
			// Keep current data on failure as requested
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
