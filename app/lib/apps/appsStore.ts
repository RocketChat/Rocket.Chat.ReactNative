import { create } from 'zustand';

import { type IAppActionButton } from './definitions';
import { normalizeLanguage } from './translations';
import log from '~/lib/methods/helpers/log';
import { getAppActionButtons, getAppsLanguages } from '~/lib/services/restApi';
import { AppsApiError } from '~/lib/services/appsApiFetch';

type TTranslationsByKey = { [key: string]: string };
type TTranslationsByLanguage = { [language: string]: TTranslationsByKey };
export type TAppTranslations = { [appId: string]: TTranslationsByLanguage };

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

const logUnlessAppsUnavailable = (e: unknown) => {
	if (e instanceof AppsApiError && e.status === 404) {
		return;
	}
	log(e);
};

let actionButtonsRequest = 0;
let translationsRequest = 0;

export const useAppsStore = create<TAppsState & TAppsActions>(set => ({
	...initialState,

	fetchActionButtons: async () => {
		const current = ++actionButtonsRequest;
		try {
			const actionButtons = await getAppActionButtons();
			if (current === actionButtonsRequest) set({ actionButtons });
		} catch (e) {
			logUnlessAppsUnavailable(e);
		}
	},

	fetchTranslations: async () => {
		const current = ++translationsRequest;
		try {
			const { apps } = await getAppsLanguages();
			const translations = apps.reduce<TAppTranslations>((acc, { id, languages }) => {
				acc[id] = Object.fromEntries(
					Object.entries(languages ?? {}).map(([language, keys]) => [normalizeLanguage(language), keys])
				);
				return acc;
			}, {});
			if (current === translationsRequest) set({ translations });
		} catch (e) {
			logUnlessAppsUnavailable(e);
		}
	},

	reset: () => {
		actionButtonsRequest += 1;
		translationsRequest += 1;
		set(initialState);
	}
}));

export const onAppsStreamData = (ddpMessage: { fields?: { args?: [[string, unknown[]]] } }) => {
	const [event] = ddpMessage?.fields?.args?.[0] || [];
	const { fetchActionButtons, fetchTranslations } = useAppsStore.getState();
	if (event === 'actions/changed') {
		fetchActionButtons();
	}
	if (event === 'app/added' || event === 'app/updated' || event === 'app/removed') {
		fetchTranslations();
	}
};
