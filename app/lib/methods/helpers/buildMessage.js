import messagesStatus from '../../../constants/messagesStatus';
import normalizeMessage from './normalizeMessage';

export default message => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
