import { ISubscription } from '../../../definitions';

export default function isGroupChat(room: ISubscription): boolean | undefined {
	return (room.uids && room.uids.length > 2) || (room.usernames && room.usernames.length > 2);
}
