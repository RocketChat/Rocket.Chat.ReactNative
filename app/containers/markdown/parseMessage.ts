import { type Options, type Root } from '@rocket.chat/message-parser';

import { parseOffThread } from './parseOffThread';
import { toPlainTextRoot } from './toPlainTextRoot';

const PARSE_CACHE_MAX = 200;
const parsedRoots = new Map<string, Root>();
const listenersByKey = new Map<string, Set<() => void>>();
const parsingKeys = new Set<string>();

export const parseCacheKey = (msg: string, options: Options): string => `${JSON.stringify(options)}\n${msg}`;

export const getParsedRoot = (key: string): Root | undefined => parsedRoots.get(key);

const markRecentlyUsed = (key: string, root: Root): void => {
	parsedRoots.delete(key);
	parsedRoots.set(key, root);
};

const storeParsedRoot = (key: string, root: Root): void => {
	if (parsedRoots.size >= PARSE_CACHE_MAX) {
		const oldestKey = parsedRoots.keys().next().value;
		if (oldestKey !== undefined) {
			parsedRoots.delete(oldestKey);
		}
	}
	parsedRoots.set(key, root);
	parsingKeys.delete(key);
	listenersByKey.get(key)?.forEach(listener => listener());
};

export const subscribeToParsedRoot = (msg: string, options: Options, listener: () => void): (() => void) => {
	const key = parseCacheKey(msg, options);
	const cachedRoot = parsedRoots.get(key);
	const listeners = listenersByKey.get(key);

	if (listeners) {
		listeners.add(listener);
	} else {
		listenersByKey.set(key, new Set([listener]));
		if (cachedRoot) {
			markRecentlyUsed(key, cachedRoot);
		} else if (!parsingKeys.has(key)) {
			parsingKeys.add(key);
			parseOffThread(msg, options, root => storeParsedRoot(key, root ?? toPlainTextRoot(msg)));
		}
	}

	return () => {
		const keyListeners = listenersByKey.get(key);
		keyListeners?.delete(listener);
		if (keyListeners?.size === 0) {
			listenersByKey.delete(key);
		}
	};
};
