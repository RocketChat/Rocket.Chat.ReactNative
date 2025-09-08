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

const getMessages = (params: ILoadMissedMessagesParams | ILoadMessagesForRoomParams): Promise<void> => {
	if ('lastOpen' in params) {
		return loadMissedMessages(params);
	}
	return loadMessagesForRoom(params);
};

export default getMessages;
