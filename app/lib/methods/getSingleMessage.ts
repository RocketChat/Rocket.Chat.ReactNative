import { getSingleMessage as getSingleMessageService } from '../services/restApi';
import { type IMessage } from '../../definitions';

const getSingleMessage = async (messageId: string): Promise<IMessage> => {
	const result = await getSingleMessageService(messageId);
	if (result.success) {
		return result.message;
	}
	throw new Error('Failed to fetch message');
};

export default getSingleMessage;
