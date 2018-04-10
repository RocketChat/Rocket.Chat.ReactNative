import normalizeMessage from './normalizeMessage';
import messagesStatus from '../../../constants/messagesStatus';

export default (message) => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
