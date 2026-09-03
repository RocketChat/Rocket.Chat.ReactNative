import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { sendMessage } from '../../../lib/methods/sendMessage';

interface ISendRoomMessageParams {
	rid?: string;
	message?: string;
	tmid?: string;
	user: Parameters<typeof sendMessage>[3];
	tshow?: boolean;
	onMessageSent: () => void;
	resetAction: () => void;
}

export const sendRoomMessage = ({
	rid,
	message,
	tmid,
	user,
	tshow,
	onMessageSent,
	resetAction
}: ISendRoomMessageParams): void => {
	if (message === undefined) {
		return;
	}
	logEvent(events.ROOM_SEND_MESSAGE);
	sendMessage(rid as string, message, tmid, user, tshow)
		.then(() => {
			onMessageSent();
			Review.pushPositiveEvent();
		})
		.catch(log);
	resetAction();
};
