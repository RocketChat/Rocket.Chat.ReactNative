import { IMessage } from '../../definitions';
import { getSingleMessage } from '../services';

const getMessage = (messageId: string): Promise<IMessage> =>
	new Promise(async (resolve, reject) => {
		try {
			const result = await getSingleMessage(messageId);
			if (result.success) {
				return resolve(result.message);
			}
			return reject();
		} catch (e) {
			return reject();
		}
	});

export default getMessage;
