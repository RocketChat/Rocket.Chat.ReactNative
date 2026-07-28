import { loadMessagesForRoom } from '../../../lib/methods/loadMessagesForRoom';
import { loadMissedMessages } from '../../../lib/methods/loadMissedMessages';
import { type RoomTypes } from '../../../lib/methods/roomTypeToApiType';

interface IGetMessagesParams {
	rid: string;
	t?: RoomTypes;
}

const getMessages = ({ rid, t }: IGetMessagesParams): Promise<void> => {
	if (!t) {
		return loadMissedMessages({ rid });
	}
	return loadMessagesForRoom({ rid, t });
};

export default getMessages;
