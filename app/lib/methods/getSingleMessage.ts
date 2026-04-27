import { getSingleMessage as getSingleMessageService } from '../services/restApi';

const getSingleMessage = (messageId: string) =>
	new Promise(async (resolve, reject) => {
		try {
			const result = await getSingleMessageService(messageId);
			if (result?.success && result.message) {
				return resolve(result.message);
			}
			return reject();
		} catch (e) {
			return reject(e);
		}
	});

export default getSingleMessage;
