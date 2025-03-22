import { IMessage } from '../../../definitions';

export const mapMessageFromAPI = ({ attachments, tlm, ts, _updatedAt, ...message }: IMessage) => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	_updatedAt: new Date(_updatedAt),
	...(attachments && {
		attachments: attachments.map(({ ts, ...attachment }) => ({
			...(ts && { ts: new Date(ts) }),
			...(attachment as any)
		}))
	})
});
