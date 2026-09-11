import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { type TGetMessageInfoResult } from '../definitions';

interface IOpenRoomDeps {
	isMasterDetail: boolean;
}

export const openRoom = async (message: TGetMessageInfoResult, { isMasterDetail }: IOpenRoomDeps): Promise<void> => {
	if (!message.rid) return;
	const roomInfo = await getRoomInfo(message.rid);
	return goRoom({
		item: roomInfo as TGoRoomItem,
		isMasterDetail,
		jumpToMessageId: message.id
	});
};
