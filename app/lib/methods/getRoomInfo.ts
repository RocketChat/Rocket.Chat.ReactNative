import { type IServerSubscription, type RoomType } from '../../definitions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getRoomInfo as getRoomInfoService } from '../services/restApi';

export interface IRoomInfoResult {
	rid: IServerSubscription['rid'];
	name: IServerSubscription['name'];
	fname: IServerSubscription['fname'];
	t: IServerSubscription['t'];
}

const getRoomInfo = async (rid: string): Promise<IRoomInfoResult | null> => {
	let result;
	result = await getSubscriptionByRoomId(rid);
	if (result) {
		return {
			rid,
			name: result.name,
			fname: result.fname,
			t: result.t as RoomType
		};
	}

	result = await getRoomInfoService(rid);
	if (result?.success && result.room) {
		return {
			rid,
			name: result.room.name as string,
			fname: result.room.fname,
			t: result.room.t as RoomType
		};
	}

	return null;
};

export default getRoomInfo;
