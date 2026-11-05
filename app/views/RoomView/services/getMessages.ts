import { type RoomType } from '~/definitions';
import { loadMessagesForRoom } from '~/lib/methods/loadMessagesForRoom';
import { loadMissedMessages } from '~/lib/methods/loadMissedMessages';

interface IGetMessagesParams {
	rid: string;
	t?: RoomType;
}

const getMessages = ({ rid, t }: IGetMessagesParams): Promise<void> => {
	if (!t) {
		return loadMissedMessages({ rid });
	}
	return loadMessagesForRoom({ rid, t });
};

export default getMessages;
