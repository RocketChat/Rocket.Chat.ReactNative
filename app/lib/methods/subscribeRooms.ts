import log from './helpers/log';
import subscribeRoomsTmp, { roomsSubscription } from './subscriptions/rooms';
import { registerStreamRestorer } from '../services/connectionRestore';

export async function subscribeRooms(): Promise<void> {
	if (!roomsSubscription?.stop) {
		try {
			await subscribeRoomsTmp();
		} catch (e) {
			log(e);
		}
	}
}

export function unsubscribeRooms(): void {
	if (roomsSubscription?.stop) {
		roomsSubscription.stop();
	}
}

// Restore the single `subscribeNotifyUser` sub set (message/notification/rooms-changed/…) that the
// day-one features ride. Resetting the guard first forces `subscribeRooms` to re-bind on `sdk.current`.
registerStreamRestorer(() => {
	unsubscribeRooms();
	return subscribeRooms();
});
