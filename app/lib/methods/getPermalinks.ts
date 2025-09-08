import log from './helpers/log';
import { TMessageModel, TSubscriptionModel, SubscriptionType } from '../../definitions';
import { store } from '../store/auxStore';
import { isGroupChat } from './helpers';
import { getRoom } from './getRoom';

type TRoomType = 'p' | 'c' | 'd';

interface ISubscription {
	t: SubscriptionType;
	name: string;
	rid: string;
}

const roomTypes = {
	p: 'group',
	c: 'channel',
	d: 'direct'
};

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
	return buildPermalinkMessage(server, isGroupChat(room), room, message.id);
}

export function getPermalinkChannel(channel: TSubscriptionModel): string {
	const { server } = store.getState().server;
	return buildPermalinkChannel(server, channel);
}

export function buildPermalinkMessage(server: string, isGoupChat: boolean, room: ISubscription, messageId: string) {
	const roomType = roomTypes[room.t as TRoomType];
	return `${server}/${roomType}/${isGoupChat ? room.rid : encodeURIComponent(room.name)}?msg=${messageId}`;
}

export function buildPermalinkChannel(server: string, channel: ISubscription) {
	const roomType = roomTypes[channel.t as TRoomType];
	return `${server}/${roomType}/${encodeURIComponent(channel.name)}`;
}
