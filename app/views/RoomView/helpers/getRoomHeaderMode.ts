import { type RoomType } from '~/definitions';
import { type RoomMembership } from '../definitions';

export type TRoomHeaderMode = 'none' | 'omnichannel' | 'thread' | 'room';

export const getRoomHeaderMode = ({
	tmid,
	t,
	status,
	membership
}: {
	tmid?: string;
	t: RoomType;
	status?: string;
	membership: RoomMembership;
}): TRoomHeaderMode => {
	if (membership === 'invited') {
		return 'none';
	}
	if (t === 'l') {
		return status === 'queued' || membership !== 'subscribed' ? 'none' : 'omnichannel';
	}
	if (tmid) {
		return 'thread';
	}
	return 'room';
};
