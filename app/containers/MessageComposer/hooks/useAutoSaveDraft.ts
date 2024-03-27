import { useCallback, useEffect, useRef } from 'react';
import { useRoute } from '@react-navigation/native';

import { useRoomContext } from '../../../views/RoomView/context';
import { useFocused } from '../context';
import { saveDraftMessage } from '../../../lib/methods/draftMessage';

export const useAutoSaveDraft = (text = '') => {
	const route = useRoute();
	const { rid, tmid, action, selectedMessages } = useRoomContext();
	const focused = useFocused();
	const oldText = useRef('');
	const intervalRef = useRef();

	const saveMessageDraft = useCallback(() => {
		if (route.name === 'ShareView') return;
		if (action === 'edit') return;

		const draftMessage = selectedMessages?.length ? JSON.stringify({ quotes: selectedMessages, msg: text }) : text;
		if (oldText.current !== draftMessage) {
			oldText.current = draftMessage;
			saveDraftMessage({ rid, tmid, draftMessage });
		}
	}, [action, rid, tmid, text, selectedMessages?.length]);

	useEffect(() => {
		if (focused) {
			intervalRef.current = setInterval(saveMessageDraft, 3000) as any;
		} else {
			clearInterval(intervalRef.current);
		}

		return () => {
			clearInterval(intervalRef.current);
			saveMessageDraft();
		};
	}, [focused, saveMessageDraft]);
};
