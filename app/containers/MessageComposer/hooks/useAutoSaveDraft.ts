import { useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

import { saveDraftMessage } from '../../../lib/methods/draftMessage';
import { useComposerRid, useComposerTmid } from '../../../views/RoomView/stores/ComposerStore';
import { useMessageAction } from '../../message/stores/MessageActionStore';
import { useFocused } from '../context';

export const useAutoSaveDraft = (text = '') => {
	const route = useRoute();
	const rid = useComposerRid();
	const tmid = useComposerTmid();
	const action = useMessageAction();
	const focused = useFocused();
	const oldText = useRef('');
	const intervalRef = useRef<number | null>(null);

	const mounted = useRef(true);

	const saveMessageDraft = useCallback(
		(m?: string) => {
			if (route.name === 'ShareView') return;
			if (action?.kind === 'edit') return;

			let draftMessage = '';
			if (action?.kind === 'quote') {
				draftMessage = JSON.stringify({ quotes: action.messageIds, msg: text });
			} else if (action?.kind === 'react') {
				draftMessage = JSON.stringify({ quotes: [action.messageId], msg: text });
			} else {
				draftMessage = m ?? text;
			}
			if (oldText.current !== draftMessage || (oldText.current === '' && draftMessage === '') || m !== undefined) {
				oldText.current = draftMessage;
				saveDraftMessage({ rid, tmid, draftMessage });
			}
		},
		[action, rid, tmid, text, route.name]
	);

	// if focused on composer input, saves every N seconds
	useEffect(() => {
		if (focused) {
			intervalRef.current = setInterval(saveMessageDraft, 3000) as any;
		} else if (intervalRef.current) {
			saveMessageDraft();
			clearInterval(intervalRef.current);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [focused, saveMessageDraft]);

	// hack to call saveMessageDraft when component is unmounted
	useEffect(() => {
		() => {};
		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(
		() => () => {
			if (!mounted.current) {
				saveMessageDraft();
			}
		},
		[saveMessageDraft]
	);

	return { saveMessageDraft };
};
