import { loadMessagesForRoom, loadMissedMessages, RoomTypes } from '../../../lib/methods';

interface IBaseParams {
	rid: string;
}

interface ILoadMessagesForRoomParams extends IBaseParams {
	t: RoomTypes;
}

interface ILoadMissedMessagesParams extends IBaseParams {
	lastOpen: Date;
}

const getMessages = async (params: ILoadMissedMessagesParams | ILoadMessagesForRoomParams): Promise<void> => {
	if ('lastOpen' in params) {
		const missedMessages = await loadMissedMessages(params);
		return missedMessages;
	}
	const roomMissedMessages = await loadMessagesForRoom(params);
	return roomMissedMessages;
};

export default getMessages;
