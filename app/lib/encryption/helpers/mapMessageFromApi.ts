import { IMessage } from '../../../definitions';

export const mapMessageFromApi = ({ attachments, tlm, ts, _updatedAt, ...message }: IMessage) => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	_updatedAt: new Date(_updatedAt),
	// FIXME: webRtcCallEndTs doesn't exist in our interface IMessage, but exists on @rocket.chat/core-typings
	// @ts-ignore
	...(message?.webRtcCallEndTs && { webRtcCallEndTs: new Date(message.webRtcCallEndTs) }),
	...(attachments && {
		attachments: attachments.map(({ ts, ...attachment }) => ({
			...(ts && { ts: new Date(ts) }),
			...(attachment as any)
		}))
	})
});
