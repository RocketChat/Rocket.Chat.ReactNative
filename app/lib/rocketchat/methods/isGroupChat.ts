import { ISubscription, TSubscriptionModel } from '../../../definitions';

export default function isGroupChat(room: ISubscription | TSubscriptionModel): boolean {
	return ((room.uids && room.uids.length > 2) || (room.usernames && room.usernames.length > 2)) ?? false;
}
