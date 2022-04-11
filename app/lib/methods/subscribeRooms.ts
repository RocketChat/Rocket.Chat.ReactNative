import log from '../../utils/log';
import subscribeRoomsTmp from './subscriptions/rooms';

// TODO: remove this
export async function subscribeRooms(this: any) {
	if (!this.roomsSub) {
		try {
			// TODO: We need to change this naming. Maybe move this logic to the SDK?
			this.roomsSub = await subscribeRoomsTmp.call(this);
		} catch (e) {
			log(e);
		}
	}
}

// TODO: remove this
export function unsubscribeRooms(this: any) {
	if (this.roomsSub) {
		this.roomsSub.stop();
		this.roomsSub = null;
	}
}
