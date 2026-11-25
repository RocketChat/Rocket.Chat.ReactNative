import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { type Root } from '@rocket.chat/message-parser';

import { getParsedRoot, parseCacheKey, subscribeToParsedRoot } from '../parseMessage';
import { toPlainTextRoot } from '../toPlainTextRoot';
import { useParseOptions } from './useParseOptions';

export const MESSAGE_MAX_PARSE_LENGTH = 10000;

const ignoreStoreChanges = () => () => {};

export const useMessageRoot = (msg: string, md: Root | undefined): Root | undefined => {
	const parseOptions = useParseOptions();
	const needsParse = !md && msg.length > 0 && msg.length <= MESSAGE_MAX_PARSE_LENGTH;

	const subscribe = useCallback(
		(listener: () => void) => subscribeToParsedRoot(msg, parseOptions, listener),
		[msg, parseOptions]
	);
	const parsedRoot = useSyncExternalStore(needsParse ? subscribe : ignoreStoreChanges, () =>
		needsParse ? getParsedRoot(parseCacheKey(msg, parseOptions)) : undefined
	);
	const plainTextRoot = useMemo(() => (msg.length > MESSAGE_MAX_PARSE_LENGTH ? toPlainTextRoot(msg) : undefined), [msg]);

	return md ?? plainTextRoot ?? parsedRoot;
};
