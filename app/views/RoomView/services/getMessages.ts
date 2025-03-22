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
	try {
		if ('lastOpen' in params) {
			await loadMissedMessages(params);
		} else {
			await loadMessagesForRoom(params);
		}
	} catch (e) {
		// Offline first
	}
	return Promise.resolve();
};

export default getMessages;
