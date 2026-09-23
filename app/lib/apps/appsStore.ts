import { create } from 'zustand';

import { type IAppActionButton } from './definitions';
import log from '~/lib/methods/helpers/log';
import { getAppActionButtons, getAppsLanguages } from '~/lib/services/restApi';
import sdk from '~/lib/services/sdk';
import { isLoginReady } from '~/lib/services/waitForLoginReady';
import { store } from '~/lib/store/auxStore';

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

export const useAppsStore = create<TAppsState & TAppsActions>(set => ({
	...initialState,

	fetchActionButtons: async () => {
		try {
			set({ actionButtons: await getAppActionButtons() });
		} catch (e) {
			set({ actionButtons: [] });
			log(e);
		}
	},

	fetchTranslations: async () => {
		try {
			const { apps } = await getAppsLanguages();
			const translations = apps.reduce<TAppTranslations>((acc, { id, languages }) => {
				acc[id] = languages;
				return acc;
			}, {});
			set({ translations });
		} catch (e) {
			set({ translations: {} });
			log(e);
		}
	},

	reset: () => set(initialState)
}));

const APPS_STREAM = 'stream-apps';
const APPS_EVENT = 'apps';

let consumers = 0;
let generation = 0;
let subscribed = false;
let loginReady = false;
let storeListener: (() => void) | null = null;
let streamListener: Promise<{ stop: () => void }> | null = null;
let streamSubscription: { unsubscribe: () => Promise<unknown> } | null = null;

const handleStreamData = (ddpMessage: { fields?: { args?: [[string, unknown[]]] } }) => {
	const [event] = ddpMessage?.fields?.args?.[0] || [];
	const { fetchActionButtons, fetchTranslations } = useAppsStore.getState();
	if (event === 'actions/changed') {
		fetchActionButtons().catch(log);
	}
	if (event === 'app/added' || event === 'app/removed' || event === 'app/updated') {
		fetchActionButtons().catch(log);
		fetchTranslations().catch(log);
	}
};

const subscribeToStream = () => {
	if (subscribed || consumers === 0) {
		return;
	}
	subscribed = true;
	const current = (generation += 1);
	const { fetchActionButtons, fetchTranslations } = useAppsStore.getState();
	fetchActionButtons().catch(log);
	fetchTranslations().catch(log);
	const fail = (e: unknown) => {
		// Leaves the next `isLoginReady()` edge free to try again.
		subscribed = false;
		log(e);
	};
	try {
		streamListener = sdk.onStreamData(APPS_STREAM, handleStreamData);
		sdk
			.subscribe(APPS_STREAM, APPS_EVENT)
			.then(subscription => {
				// The last consumer may have unmounted while this was in flight.
				if (current !== generation || consumers === 0) {
					subscription?.unsubscribe().catch(log);
					return;
				}
				streamSubscription = subscription ?? null;
			})
			.catch(fail);
	} catch (e) {
		fail(e);
	}
};

const unsubscribeFromStream = () => {
	generation += 1;
	subscribed = false;
	streamListener?.then(listener => listener.stop()).catch(log);
	streamListener = null;
	streamSubscription?.unsubscribe().catch(log);
	streamSubscription = null;
};

// The composer can mount before the first connection, and `disconnect()` drops both the SDK and the
// store, so setup follows the connection rather than the mount.
const handleStoreChange = () => {
	const ready = isLoginReady();
	if (ready === loginReady) {
		return;
	}
	loginReady = ready;
	if (ready) {
		subscribeToStream();
	} else {
		unsubscribeFromStream();
	}
};

export const subscribeToApps = (): (() => void) => {
	consumers += 1;
	if (consumers === 1) {
		loginReady = isLoginReady();
		storeListener = store.subscribe(handleStoreChange);
		if (loginReady) {
			subscribeToStream();
		}
	}

	return () => {
		consumers = Math.max(consumers - 1, 0);
		if (consumers > 0) {
			return;
		}
		storeListener?.();
		storeListener = null;
		unsubscribeFromStream();
	};
};
