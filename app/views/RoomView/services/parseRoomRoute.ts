import { getUidDirectMessage } from '../../../lib/methods/helpers';
import { type IRoomViewProps, type TRoomRouteParse } from '../definitions';
import { type TRoomOrPreview } from '../../../definitions/TRoom';

export const parseRoomRoute = (params: IRoomViewProps['route']['params']): TRoomRouteParse => {
	if (!params?.rid || !params.t) {
		return { status: 'invalid' };
	}
	const { rid, t, tmid, name, fname, prid, visitor, joinCodeRequired, roomUserId } = params;
	const initialRoom: TRoomOrPreview = { rid, t, name, fname, prid, visitor, joinCodeRequired };
	return {
		status: 'valid',
		input: { rid, t, tmid, name, initialRoom, roomUserId: roomUserId ?? getUidDirectMessage(initialRoom) }
	};
};
