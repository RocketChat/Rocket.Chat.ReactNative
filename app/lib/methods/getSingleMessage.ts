import { type IMessage } from '../../definitions';
import { getSingleMessage as getSingleMessageService } from '../services/restApi';

const getSingleMessage = (messageId: string): Promise<IMessage> =>
	new Promise(async (resolve, reject) => {
		try {
			const result = await getSingleMessageService(messageId);
			if (result.success && result.message) {
				const { message } = result;
				// Map _id to id to match IMessage interface structure
				// The API returns messages with _id, but IMessage requires id field
				return resolve({
					...message,
					id: message._id
				} as unknown as IMessage);
			}
			return reject();
		} catch (e) {
			return reject(e);
		}
	});

export default getSingleMessage;
