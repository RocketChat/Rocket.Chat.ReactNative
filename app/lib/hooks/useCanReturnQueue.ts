import { useEffect } from 'react';
import { create } from 'zustand';

import { getRoutingConfig } from '../services/restApi';
import { useAppSelector } from './useAppSelector';

interface IRoutingConfigState {
	server: string | null;
	returnQueue: boolean;
	load: (server: string) => Promise<void>;
	reset: () => void;
}

export const useRoutingConfigStore = create<IRoutingConfigState>((set, get) => ({
	server: null,
	returnQueue: false,
	reset: () => set({ server: null, returnQueue: false }),
	load: async server => {
		if (get().server === server) {
			return;
		}
		set({ server, returnQueue: false });
		try {
			const { returnQueue } = await getRoutingConfig();
			if (get().server === server) {
				set({ returnQueue });
			}
		} catch {
			if (get().server === server) {
				set({ server: null });
			}
		}
	}
}));

export function useCanReturnQueue(enabled: boolean): boolean {
	const server = useAppSelector(state => state.server.server);
	const load = useRoutingConfigStore(s => s.load);

	useEffect(() => {
		if (enabled && server) {
			load(server);
		}
	}, [enabled, server, load]);

	return useRoutingConfigStore(s => enabled && s.server === server && s.returnQueue);
}
