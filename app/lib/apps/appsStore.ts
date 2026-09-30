import { create } from 'zustand';

import { type IAppActionButton } from './definitions';
import { normalizeLanguage } from './translations';
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

let storeVersion = 0;

export const useAppsStore = create<TAppsState & TAppsActions>(set => ({
	...initialState,

	fetchActionButtons: async () => {
		const version = storeVersion;
		try {
			const actionButtons = await getAppActionButtons();
			if (version === storeVersion) {
				set({ actionButtons });
			}
		} catch {
			// Servers without the Apps framework reject this; keep whatever was already loaded.
		}
	},

	fetchTranslations: async () => {
		const version = storeVersion;
		try {
			const { apps } = await getAppsLanguages();
			if (version !== storeVersion) {
				return;
			}
			const translations = apps.reduce<TAppTranslations>((acc, { id, languages }) => {
				acc[id] = Object.entries(languages).reduce<TAppTranslations[string]>((byLanguage, [language, keys]) => {
					byLanguage[normalizeLanguage(language)] = keys;
					return byLanguage;
				}, {});
				return acc;
			}, {});
			set({ translations });
		} catch {
			// Servers without the Apps framework reject this; keep whatever was already loaded.
		}
	},

	reset: () => {
		storeVersion += 1;
		set(initialState);
	}
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
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;

const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 60000;

const clearRetry = () => {
	if (retryTimer) {
		clearTimeout(retryTimer);
		retryTimer = null;
	}
};

const handleStreamData = (ddpMessage: { fields?: { args?: [[string, unknown[]]] } }) => {
	const [event] = ddpMessage?.fields?.args?.[0] || [];
	const { fetchActionButtons, fetchTranslations } = useAppsStore.getState();
	if (event === 'actions/changed') {
		fetchActionButtons().catch(log);
	}
	// Translations ship with an app, so any install, update or removal can change them.
	if (typeof event === 'string' && event.startsWith('app/')) {
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
	let listener: typeof streamListener = null;
	const fail = (e: unknown) => {
		log(e);
		listener?.then(l => l.stop()).catch(log);
		if (current !== generation) {
			return;
		}
		subscribed = false;
		streamListener = null;
		clearRetry();
		const delay = Math.min(RETRY_BASE_MS * 2 ** retryAttempt, RETRY_MAX_MS);
		retryAttempt += 1;
		retryTimer = setTimeout(() => {
			retryTimer = null;
			if (current === generation && loginReady) {
				subscribeToStream();
			}
		}, delay);
	};
	try {
		listener = sdk.onStreamData(APPS_STREAM, handleStreamData);
		streamListener = listener;
		sdk
			.subscribe(APPS_STREAM, APPS_EVENT)
			.then(subscription => {
				// The last consumer may have unmounted while this was in flight.
				if (current !== generation || consumers === 0) {
					subscription?.unsubscribe().catch(log);
					return;
				}
				streamSubscription = subscription ?? null;
				retryAttempt = 0;
			})
			.catch(fail);
	} catch (e) {
		fail(e);
	}
};

const unsubscribeFromStream = () => {
	generation += 1;
	clearRetry();
	retryAttempt = 0;
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
