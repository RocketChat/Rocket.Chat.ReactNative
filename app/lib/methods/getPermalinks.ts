import log from './helpers/log';
import { TMessageModel, TSubscriptionModel } from '../../definitions';
import { store } from '../store/auxStore';
import { isGroupChat } from './helpers';
import { getRoom } from './getRoom';

type TRoomType = 'p' | 'c' | 'd';

export async function getPermalinkMessage(message: TMessageModel): Promise<string | null> {
	if (!message.subscription) return null;
	let room: TSubscriptionModel;
	try {
		room = await getRoom(message.subscription.id);
	} catch (e) {
		log(e);
		return null;
	}
	const { server } = store.getState().server;
	const roomType = {
		p: 'group',
		c: 'channel',
		d: 'direct'
	}[room.t as TRoomType];
	return `${server}/${roomType}/${isGroupChat(room) ? room.rid : room.name}?msg=${message.id}`;
}

export function getPermalinkChannel(channel: TSubscriptionModel): string {
	const { server } = store.getState().server;
	const roomType = {
		p: 'group',
		c: 'channel',
		d: 'direct'
	};

	// @ts-ignore - wrong SubscriptionType
	const room = roomType[channel.t];

	return `${server}/${room}/${channel.name}`;
}
