import { useCallback, useSyncExternalStore } from 'react';
import { type Root } from '@rocket.chat/message-parser';

import { getParsedRoot, subscribeToParsedRoot } from '../parseMessage';
import { useParseOptions } from './useParseOptions';

const ignoreStoreChanges = () => () => {};

export const useMessageRoot = (msg: string, md: Root | undefined): Root | undefined => {
	const parseOptions = useParseOptions();
	const hasServerRoot = !!md;

	const subscribe = useCallback(
		(listener: () => void) => subscribeToParsedRoot(msg, parseOptions, listener),
		[msg, parseOptions]
	);
	const parsedRoot = useSyncExternalStore(hasServerRoot ? ignoreStoreChanges : subscribe, () =>
		hasServerRoot ? undefined : getParsedRoot(msg, parseOptions)
	);

	return md ?? parsedRoot;
};
