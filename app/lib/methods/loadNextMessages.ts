import orderBy from 'lodash/orderBy';

import log from './helpers/log';
import updateMessages from './updateMessages';
import { type TMessageModel } from '~/definitions';
import { getNextMessages } from '../services/restApi';
import { withChunkLoaders } from './withChunkLoaders';

const COUNT = 50;

interface ILoadNextMessages {
	rid: string;
	ts: Date;
	loaderItem: TMessageModel;
}

export async function loadNextMessages(args: ILoadNextMessages): Promise<void> {
	try {
		const { messages: fetched, moreBefore, moreAfter } = await getNextMessages({ rid: args.rid, after: args.ts, count: COUNT });
		const messages = await withChunkLoaders(orderBy(fetched, 'ts'), { moreBefore, moreAfter });
		await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
	} catch (e) {
		log(e);
		throw e;
	}
}
