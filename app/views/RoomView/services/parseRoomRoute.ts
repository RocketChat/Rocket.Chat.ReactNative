import { getUidDirectMessage } from '../../../lib/methods/helpers';
import { type IRoomScreenInput, type IRoomViewProps } from '../definitions';
import { type TRoomOrPreview } from '../../../definitions/TRoom';

export const parseRoomRoute = (params: IRoomViewProps['route']['params']): IRoomScreenInput => {
	const { rid, t, tmid, name, fname, prid, visitor, joinCodeRequired, roomUserId } = params ?? {};
	const initialRoom: TRoomOrPreview = { rid: rid ?? '', t: t ?? '', name, fname, prid, visitor, joinCodeRequired };
	return { rid, t, tmid, name, initialRoom, roomUserId: roomUserId ?? getUidDirectMessage(initialRoom) };
};
