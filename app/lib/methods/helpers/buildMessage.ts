import { IMessage } from '../../../definitions';
import messagesStatus from '../../../constants/messagesStatus';
import normalizeMessage from './normalizeMessage';

export default (message: IMessage): IMessage | null => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
