import log from './helpers/log';
import { type TAnyMessageModel } from '~/definitions/IMessage';
import { type ISubscription, type TSubscriptionModel } from '~/definitions/ISubscription';
import { store } from '../store/auxStore';
import { isGroupChat, roomTypeToPathSegment } from './helpers/roomType';
import { getRoom } from './getRoom';

type TPermalinkRoom = Pick<ISubscription, 'rid' | 't' | 'name'>;

export async function getPermalinkMessage(message: TAnyMessageModel): Promise<string | null> {
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

export function buildPermalinkMessage(server: string, isGoupChat: boolean, room: TPermalinkRoom, messageId: string) {
	const pathSegment = roomTypeToPathSegment(room.t);
	return `${server}/${pathSegment}/${isGoupChat ? room.rid : encodeURIComponent(room.name)}?msg=${messageId}`;
}

export function buildPermalinkChannel(server: string, channel: TPermalinkRoom) {
	const pathSegment = roomTypeToPathSegment(channel.t);
	return `${server}/${pathSegment}/${encodeURIComponent(channel.name)}`;
}
