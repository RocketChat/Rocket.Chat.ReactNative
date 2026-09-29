import { create } from 'zustand';

import { type IAppActionButton } from './definitions';
import log from '~/lib/methods/helpers/log';
import { getAppActionButtons, getAppsLanguages } from '~/lib/services/restApi';

export type TAppTranslations = {
	// appId -> language -> key -> translation
	[appId: string]: { [language: string]: { [key: string]: string } };
};

type TAppsState = {
	actionButtons: IAppActionButton[];
	translations: TAppTranslations;
};

type TAppsActions = {
	fetchActionButtons: () => Promise<void>;
	fetchTranslations: () => Promise<void>;
	reset: () => void;
};

const initialState: TAppsState = {
	actionButtons: [],
	translations: {}
};

let generation = 0;

export const useAppsStore = create<TAppsState & TAppsActions>(set => ({
	...initialState,

	fetchActionButtons: async () => {
		const current = generation;
		try {
			const actionButtons = await getAppActionButtons();
			if (current === generation) set({ actionButtons });
		} catch (e) {
			if (current === generation) set({ actionButtons: [] });
			log(e);
		}
	},

	fetchTranslations: async () => {
		const current = generation;
		try {
			const { apps } = await getAppsLanguages();
			const translations = apps.reduce<TAppTranslations>((acc, { id, languages }) => {
				acc[id] = languages;
				return acc;
			}, {});
			if (current === generation) set({ translations });
		} catch (e) {
			if (current === generation) set({ translations: {} });
			log(e);
		}
	},

	reset: () => {
		generation += 1;
		set(initialState);
	}
}));

export const onAppsStreamData = (ddpMessage: { fields?: { args?: [[string, unknown[]]] } }) => {
	const [event] = ddpMessage?.fields?.args?.[0] || [];
	const { fetchActionButtons, fetchTranslations } = useAppsStore.getState();
	if (event === 'actions/changed') {
		fetchActionButtons().catch(log);
	}
	if (event === 'app/added') {
		fetchTranslations().catch(log);
	}
};
