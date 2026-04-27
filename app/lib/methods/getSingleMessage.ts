import { getSingleMessage as getSingleMessageService } from '../services/restApi';
import { type IMessage } from '../../definitions';

const getSingleMessage = (messageId: string): Promise<IMessage> =>
	new Promise<IMessage>(async (resolve, reject) => {
		try {
			const result = await getSingleMessageService(messageId);
			if (result?.success && result.message) {
				return resolve(result.message);
			}
			return reject(new Error('Failed to get message'));
		} catch (e) {
			return reject(e);
		}
	});

export default getSingleMessage;
