import { type IMessage } from '../../definitions';
import { getSingleMessage as getSingleMessageService } from '../services/restApi';

const getSingleMessage = async (messageId: string): Promise<IMessage> => {
	const result = await getSingleMessageService(messageId);
	if (result.success && result.message) {
		const { message } = result;
		return { ...message, id: message._id } as IMessage;
	}
	throw new Error('Failed to get message');
};

export default getSingleMessage;
