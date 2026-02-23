import { useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

import { saveDraftMessage } from '../../../lib/methods/draftMessage';
import { useRoomContext } from '../../../views/RoomView/context';
import { useFocused } from '../context';

export const useAutoSaveDraft = (text = '') => {
	'use memo';

	const route = useRoute();
	const { rid, tmid, action, selectedMessages } = useRoomContext();
	const focused = useFocused();
	const oldText = useRef('');
	const intervalRef = useRef<number | null>(null);

	const mounted = useRef(true);

	const saveMessageDraft = useCallback(
		(m?: string) => {
			if (route.name === 'ShareView') return;
			if (action === 'edit') return;

			let draftMessage = '';
			if (selectedMessages?.length) {
				draftMessage = JSON.stringify({ quotes: selectedMessages, msg: text });
			} else {
				draftMessage = m ?? text;
			}
			if (oldText.current !== draftMessage || (oldText.current === '' && draftMessage === '') || m !== undefined) {
				oldText.current = draftMessage;
				saveDraftMessage({ rid, tmid, draftMessage });
			}
		},
		[action, rid, tmid, text, selectedMessages, route.name]
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
