import { TMessageModel } from '../../../definitions';
import { parseModelMessageToMessage } from './parseModelMessageToMessage';

export const mapMessageFromDB = (messageModel: TMessageModel) => {
	const parsedMessage = parseModelMessageToMessage(messageModel);
	return {
		...parsedMessage,
		ts: new Date(parsedMessage.ts),
		...(parsedMessage.tlm && { tlm: new Date(parsedMessage.tlm) }),
		_updatedAt: new Date(parsedMessage._updatedAt),
		// FIXME: webRtcCallEndTs doesn't exist in our interface IMessage, but exists on @rocket.chat/core-typings
		// @ts-ignore
		...(parsedMessage?.webRtcCallEndTs && { webRtcCallEndTs: new Date(parsedMessage.webRtcCallEndTs) }),
		...(parsedMessage.attachments && {
			attachments: parsedMessage.attachments.map(({ ts, ...attachment }) => ({
				...(ts && { ts: new Date(ts) }),
				...(attachment as any)
			}))
		})
	};
};
