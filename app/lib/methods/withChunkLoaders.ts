import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { getMessageById } from '../database/services/Message';
import { type IMessage } from '~/definitions';
import { buildLoaderRow } from './helpers/buildLoaderRow';

interface IChunkEdges {
	moreBefore: boolean;
	moreAfter: boolean;
}

const isMissingLocally = async (message: IMessage) => !(await getMessageById(message._id));

export async function withChunkLoaders(messages: IMessage[], { moreBefore, moreAfter }: IChunkEdges): Promise<IMessage[]> {
	if (!messages.length) {
		return messages;
	}
	const firstMessage = messages[0];
	const lastMessage = messages[messages.length - 1];
	const olderLoaders =
		moreBefore && (await isMissingLocally(firstMessage)) ? [buildLoaderRow(firstMessage, MessageTypeLoad.PREVIOUS_CHUNK)] : [];
	const newerLoaders =
		moreAfter && (await isMissingLocally(lastMessage)) ? [buildLoaderRow(lastMessage, MessageTypeLoad.NEXT_CHUNK)] : [];
	return [...olderLoaders, ...messages, ...newerLoaders];
}
