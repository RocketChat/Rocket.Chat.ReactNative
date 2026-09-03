import { takeInquiry, takeResume } from '../../../ee/omnichannel/lib';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { joinRoom as joinRoomService } from '../../../lib/services/restApi';
import { type IJoinRoomContext, type IRoomViewState } from '../definitions';

export const joinRoom = async (room: IRoomViewState['room'], { requestJoinCode, onJoin }: IJoinRoomContext): Promise<void> => {
	logEvent(events.ROOM_JOIN);
	try {
		if (room.t === 'l') {
			if ('_id' in room) {
				await takeInquiry(room._id);
			}
			onJoin();
			return;
		}
		const { joinCodeRequired, rid } = room;
		if (joinCodeRequired) {
			requestJoinCode?.();
			return;
		}
		await joinRoomService(rid, null, room.t as 'c' | 'p');
		onJoin();
	} catch (e) {
		log(e);
	}
};

export const resumeRoom = async (room: IRoomViewState['room'], onJoin: () => void): Promise<void> => {
	logEvent(events.ROOM_RESUME);
	try {
		if (room.t === 'l') {
			if ('rid' in room) {
				await takeResume(room.rid);
			}
			onJoin();
		}
	} catch (e) {
		log(e);
	}
};
