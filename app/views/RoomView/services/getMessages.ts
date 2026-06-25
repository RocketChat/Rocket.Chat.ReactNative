import { loadMessagesForRoom } from '../../../lib/methods/loadMessagesForRoom';
import { loadMissedMessages } from '../../../lib/methods/loadMissedMessages';
import { type RoomTypes } from '../../../lib/methods/roomTypeToApiType';

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
