import { type IMessage } from '@rocket.chat/core-typings';
import { getSingleMessage as getSingleMessageService } from '../services/restApi';

const getSingleMessage = (messageId: string): Promise<IMessage> =>
	new Promise(async (resolve, reject) => {
		try {
			const result = await getSingleMessageService(messageId);
			if (result.message) {
				return resolve(result.message);
			}
			return reject();
		} catch (e) {
			return reject(e);
		}
	});

export default getSingleMessage;
