import orderBy from 'lodash/orderBy';

import log from './helpers/log';
import { type IMessage } from '~/definitions';
import updateMessages from './updateMessages';
import { getSurroundingMessages } from '../services/restApi';
import { withChunkLoaders } from './withChunkLoaders';

const COUNT = 50;

export async function loadSurroundingMessages({ messageId, rid }: { messageId: string; rid: string }): Promise<IMessage[]> {
	try {
		const { messages: fetched, moreBefore, moreAfter } = await getSurroundingMessages({ rid, messageId, count: COUNT });

		if (!fetched.length) {
			return [];
		}

		const messages = await withChunkLoaders(orderBy(fetched, 'ts'), { moreBefore, moreAfter });
		await updateMessages({ rid, update: messages });
		return messages;
	} catch (e) {
		log(e);
		throw e;
	}
}
