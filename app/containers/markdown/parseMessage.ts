import { type Options, type Root } from '@rocket.chat/message-parser';

import { parseOffThread } from './parseOffThread';
import { toPlainTextRoot } from './toPlainTextRoot';

export const MESSAGE_MAX_PARSE_LENGTH = 10000;

const PARSE_CACHE_MAX = 200;
const parsedRoots = new Map<string, Root>();
const listenersByKey = new Map<string, Set<() => void>>();
const parsingKeys = new Set<string>();

const parseCacheKey = (msg: string, options: Options): string => `${JSON.stringify(options)}\n${msg}`;

const isParsedOffThread = (msg: string): boolean => msg.length > 0 && msg.length <= MESSAGE_MAX_PARSE_LENGTH;

const evictUnlistenedRootsOverLimit = (): void => {
	for (const key of parsedRoots.keys()) {
		if (parsedRoots.size < PARSE_CACHE_MAX) {
			return;
		}
		if (!listenersByKey.has(key)) {
			parsedRoots.delete(key);
		}
	}
};

const cacheRoot = (key: string, root: Root): void => {
	evictUnlistenedRootsOverLimit();
	parsedRoots.set(key, root);
};

const markRecentlyUsed = (key: string, root: Root): void => {
	parsedRoots.delete(key);
	parsedRoots.set(key, root);
};

const storeParsedRoot = (key: string, root: Root): void => {
	cacheRoot(key, root);
	parsingKeys.delete(key);
	listenersByKey.get(key)?.forEach(listener => listener());
};

export const getParsedRoot = (msg: string, options: Options): Root | undefined => {
	const key = parseCacheKey(msg, options);
	const cachedRoot = parsedRoots.get(key);
	if (cachedRoot || isParsedOffThread(msg)) {
		return cachedRoot;
	}
	const plainTextRoot = toPlainTextRoot(msg);
	cacheRoot(key, plainTextRoot);
	return plainTextRoot;
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
		} else if (isParsedOffThread(msg) && !parsingKeys.has(key)) {
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
