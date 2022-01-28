import log from '../../../utils/log';
import { IMessage, ISubscription } from '../../../definitions';
import reduxStore from '../../createStore';
import RocketChat from '../../rocketchat';
import isGroupChat from './isGroupChat';

type TRoomType = 'p' | 'c' | 'd';

export default async function getPermalinkMessage(message: IMessage): Promise<string | null> {
	let room: ISubscription;
	try {
		room = await RocketChat.getRoom(message.subscription.id);
	} catch (e) {
		log(e);
		return null;
	}
	const { server } = reduxStore.getState().server;
	const roomType = {
		p: 'group',
		c: 'channel',
		d: 'direct'
	}[room.t as TRoomType];
	return `${server}/${roomType}/${isGroupChat(room) ? room.rid : room.name}?msg=${message.id}`;
}
