import log from '../../../utils/log';
import { TMessageModel, TSubscriptionModel } from '../../../definitions';
import reduxStore from '../../createStore';
import getRoom from './getRoom';
import isGroupChat from './isGroupChat';

type TRoomType = 'p' | 'c' | 'd';

export default async function getPermalinkMessage(message: TMessageModel): Promise<string | null> {
	if (!message.subscription) return null;
	let room: TSubscriptionModel;
	try {
		room = await getRoom(message.subscription.id);
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
