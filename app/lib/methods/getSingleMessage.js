import RocketChat from '../rocketchat';

const getSingleMessage = messageId => new Promise(async(resolve, reject) => {
	try {
		const result = await RocketChat.getSingleMessage(messageId);
		if (result.success) {
			return resolve(result.message);
		}
		return reject();
	} catch (e) {
		return reject();
	}
});

export default getSingleMessage;
