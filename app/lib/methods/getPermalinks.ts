import log from './helpers/log';
import { IMessage, TSubscriptionModel } from '../../definitions';
import { store } from '../store/auxStore';
import { isGroupChat } from './helpers';
import { getRoom } from './getRoom';

type TRoomType = 'p' | 'c' | 'd';

export async function getPermalinkMessage(message: IMessage): Promise<string | null> {
	let room: TSubscriptionModel;
	try {
		room = await getRoom(message.rid);
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
