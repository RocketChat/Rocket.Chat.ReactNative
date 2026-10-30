import { type TThreadModel } from '~/definitions';

export type TThreadRow = Pick<TThreadModel, 'id' | 'u' | 'ts' | 'msg' | 'attachments' | 'tcount' | 'replies'>;

export const toThreadRow = ({ id, u, ts, msg, attachments, tcount, replies }: TThreadRow): TThreadRow => ({
	id,
	u,
	ts,
	msg,
	attachments,
	tcount,
	replies
});
