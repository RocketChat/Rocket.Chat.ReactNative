import { type TMessageModel, type TThreadMessageModel } from '../../../definitions';
import { getMessageById } from '../../../lib/database/services/Message';
import { getThreadMessageById } from '../../../lib/database/services/ThreadMessage';
import getSingleMessage from '../../../lib/methods/getSingleMessage';

const getMessageInfo = async (messageId: string): Promise<TMessageModel | TThreadMessageModel | any | null> => {
	const message = await getMessageById(messageId);
	if (message) {
		return {
			id: message.id,
			rid: message?.subscription?.id,
			tmid: message.tmid,
			msg: message.msg,
			// ts lets a locally-cached but out-of-window target derive its own Anchored Window bound.
			ts: message.ts
		};
	}

	const threadMessage = await getThreadMessageById(messageId);
	if (threadMessage) {
		return {
			id: threadMessage.id,
			rid: threadMessage?.subscription?.id,
			tmid: threadMessage.rid,
			msg: threadMessage.msg,
			ts: threadMessage.ts
		};
	}

	const singleMessage: any = await getSingleMessage(messageId);
	if (singleMessage) {
		return {
			id: singleMessage._id,
			rid: singleMessage.rid,
			tmid: singleMessage.tmid,
			msg: singleMessage.msg,
			ts: singleMessage.ts,
			fromServer: true
		};
	}

	return null;
};

export default getMessageInfo;
