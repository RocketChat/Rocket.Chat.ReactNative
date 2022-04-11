import { IServerSubscription, RoomType } from '../../definitions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getRoomInfo } from '../services';

export interface IRoomInfoResult {
	rid: IServerSubscription['rid'];
	name: IServerSubscription['name'];
	fname: IServerSubscription['fname'];
	t: IServerSubscription['t'];
}

const getInfo = async (rid: string): Promise<IRoomInfoResult | null> => {
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

	result = await getRoomInfo(rid);
	if (result?.success) {
		return {
			rid,
			name: result.room.name as string,
			fname: result.room.fname,
			t: result.room.t
		};
	}

	return null;
};

export default getInfo;
