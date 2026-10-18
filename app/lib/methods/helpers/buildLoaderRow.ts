import dayjs from '~/lib/dayjs';
import { MessageTypeLoad } from '~/lib/constants/messageTypeLoad';
import { type IMessage } from '~/definitions';
import { generateLoadMoreId } from './generateLoadMoreId';

const OFFSET_MS: Record<MessageTypeLoad, number> = {
	[MessageTypeLoad.MORE]: -1,
	[MessageTypeLoad.PREVIOUS_CHUNK]: -1,
	[MessageTypeLoad.NEXT_CHUNK]: 1
};

export const buildLoaderRow = (anchor: Pick<IMessage, '_id' | 'rid' | 'ts' | 'msg'>, t: MessageTypeLoad): IMessage =>
	({
		_id: generateLoadMoreId(anchor._id),
		rid: anchor.rid,
		ts: dayjs(anchor.ts).add(OFFSET_MS[t], 'millisecond').toDate(),
		t,
		msg: anchor.msg
	}) as IMessage;

export const getNewestLoadedTs = (newerLoaderTs: Date): Date =>
	dayjs(newerLoaderTs).subtract(OFFSET_MS[MessageTypeLoad.NEXT_CHUNK], 'millisecond').toDate();
