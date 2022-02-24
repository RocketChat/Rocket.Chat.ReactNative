import { ILastMessage, IMessage } from '../../../definitions';
import messagesStatus from '../../../constants/messagesStatus';
import normalizeMessage from './normalizeMessage';

export default (message: IMessage | ILastMessage): IMessage => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
