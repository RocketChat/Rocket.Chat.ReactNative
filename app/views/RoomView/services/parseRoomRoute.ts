import { getUidDirectMessage } from '~/lib/methods/helpers/getUidDirectMessage';
import { type IRoomScreenInput, type IRoomViewProps } from '../definitions';
import { type TRoomOrPreview } from '~/definitions/TRoom';

export const parseRoomRoute = (params: IRoomViewProps['route']['params']): IRoomScreenInput | null => {
	if (!params?.rid || !params.t) {
		return null;
	}
	const { rid, t, tmid, name, prid, visitor, joinCodeRequired, roomUserId } = params;
	const initialRoom: TRoomOrPreview = { rid, t, name, prid, visitor, joinCodeRequired };
	return { rid, t, tmid, name, initialRoom, roomUserId: roomUserId ?? getUidDirectMessage(initialRoom) };
};
