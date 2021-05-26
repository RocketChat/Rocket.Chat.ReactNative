import moment from 'moment';

import { MESSAGE_TYPE_LOAD_MORE } from '../../constants/messageTypeLoad';
import log from '../../utils/log';
import { getMessageById } from '../database/services/Message';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from '../utils';

const COUNT = 50;

async function load({ rid: roomId, latest, t }) {
	let params = { roomId, count: COUNT };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}

	const apiType = this.roomTypeToApiType(t);
	if (!apiType) {
		return [];
	}

	// RC 0.48.0
	const data = await this.sdk.get(`${ apiType }.history`, params);
	if (!data || data.status === 'error') {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, args);
			if (data?.length) {
				const lastMessage = data[data.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id);
				if (!lastMessageRecord && data.length === COUNT) {
					const loadMoreItem = {
						_id: generateLoadMoreId(lastMessage._id),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).subtract(1, 'millisecond'),
						t: MESSAGE_TYPE_LOAD_MORE,
						msg: lastMessage.msg
					};
					data.push(loadMoreItem);
				}
				await updateMessages({ rid: args.rid, update: data, loaderItem: args.loaderItem });
				return resolve(data);
			} else {
				return resolve([]);
			}
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
