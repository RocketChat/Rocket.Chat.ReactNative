import { type RoomMembership } from '../definitions';

export type TRoomHeaderMode = 'none' | 'omnichannel' | 'thread' | 'room';

export const getRoomHeaderMode = ({
	rid,
	tmid,
	t,
	status,
	membership
}: {
	rid?: string;
	tmid?: string;
	t?: string;
	status?: string;
	membership: RoomMembership;
}): TRoomHeaderMode => {
	if (!rid || membership === 'invited') {
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
