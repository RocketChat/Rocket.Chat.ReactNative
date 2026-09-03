import { getUidDirectMessage } from '../../../lib/methods/helpers';
import { type IRoomScreenInput, type IRoomViewProps, type TRoomRouteParse } from '../definitions';

// Navigation can transiently wipe this route's params to undefined (e.g. popTo with no params while
// retained below the stack top), so the caller snapshots the result once at mount.
export const parseRoomRoute = (params: IRoomViewProps['route']['params']): TRoomRouteParse => {
	if (!params?.rid || !params.t) {
		return { status: 'invalid' };
	}
	const { rid, t, tmid, name, fname, prid, visitor, joinCodeRequired, roomUserId } = params;
	const initialRoom: IRoomScreenInput['initialRoom'] = { rid, t, name, fname, prid, visitor, joinCodeRequired };
	return {
		status: 'valid',
		input: { rid, t, tmid, name, initialRoom, roomUserId: roomUserId ?? getUidDirectMessage(initialRoom) }
	};
};
