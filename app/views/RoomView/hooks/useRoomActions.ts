import { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { type IUseRoomActionsParams, type IUseRoomActionsResult } from '../definitions';

export function useRoomActions({ rid, tmid, roomStore, userRef, resetAction }: IUseRoomActionsParams): IUseRoomActionsResult {
	'use memo';

	const handleSendMessage = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessage(rid as string, message, tmid, userRef.current, tshow).then(() => {
			roomStore.getState().markMessageSent();
			Review.pushPositiveEvent();
		});
		resetAction();
	};

	const onJoin = () => {
		roomStore.getState().join();
	};

	return {
		onJoin,
		handleSendMessage
	};
}
