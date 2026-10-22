import { useRoute } from '@react-navigation/native';
import { type RefObject, useCallback, useEffect } from 'react';

import { type TMessageActionState } from '~/definitions';
import { saveDraftMessage } from '~/lib/methods/draftMessage';
import { useComposerStoreApi } from '../ComposerStore';
import { useMessageActionStoreApi } from '~/containers/message/stores/MessageActionStore';
import { useFocused } from '../context';

const AUTO_SAVE_INTERVAL = 3000;

const serializeDraft = (action: TMessageActionState, text: string) => {
	if (action?.kind === 'quote') {
		return JSON.stringify({ quotes: action.messageIds, msg: text });
	}
	if (action?.kind === 'react') {
		return JSON.stringify({ quotes: [action.messageId], msg: text });
	}
	return text;
};

export const useAutoSaveDraft = (textRef: RefObject<string>) => {
	const routeName = useRoute().name;
	const composerStore = useComposerStoreApi();
	const messageActionStore = useMessageActionStoreApi();
	const focused = useFocused();

	const saveDraft = useCallback(() => {
		if (routeName === 'ShareView') return;
		const { action } = messageActionStore.getState();
		if (action?.kind === 'edit') return;

		const { rid, tmid } = composerStore.getState();
		saveDraftMessage({ rid, tmid, draftMessage: serializeDraft(action, textRef.current) });
	}, [routeName, textRef, composerStore, messageActionStore]);

	useEffect(() => {
		const interval = focused ? setInterval(saveDraft, AUTO_SAVE_INTERVAL) : undefined;

		return () => {
			clearInterval(interval);
			saveDraft();
		};
	}, [focused, saveDraft]);

	return { saveDraft };
};
