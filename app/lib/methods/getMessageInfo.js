import { getMessageById } from '../database/services/Message';
import { getThreadMessageById } from '../database/services/ThreadMessage';
import getSingleMessage from './getSingleMessage';

const getMessageInfo = async(messageId) => {
	let result;
	result = await getMessageById(messageId);
	if (result) {
		return {
			id: result.id,
			rid: result.subscription.id,
			tmid: result.tmid,
			msg: result.msg
		};
	}

	result = await getThreadMessageById(messageId);
	if (result) {
		return {
			id: result.id,
			rid: result.subscription.id,
			tmid: result.rid,
			msg: result.msg
		};
	}

	result = await getSingleMessage(messageId);
	if (result) {
		return {
			id: result._id,
			rid: result.rid,
			tmid: result.tmid,
			msg: result.msg,
			fromServer: true
		};
	}

	return null;
};

export default getMessageInfo;
