import { TMessageModel } from '../../../definitions';

export const mapMessageFromDB = (messageModel: TMessageModel) => {
	const parsedMessage = messageModel.asPlain();
	return {
		...parsedMessage,
		ts: new Date(parsedMessage.ts),
		...(parsedMessage.tlm && { tlm: new Date(parsedMessage.tlm) }),
		_updatedAt: new Date(parsedMessage._updatedAt),
		...(parsedMessage.attachments && {
			attachments: parsedMessage.attachments.map(({ ts, ...attachment }) => ({
				...(ts && { ts: new Date(ts) }),
				...(attachment as any)
			}))
		})
	};
};
