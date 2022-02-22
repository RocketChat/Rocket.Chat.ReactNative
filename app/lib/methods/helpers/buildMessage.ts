import { IMessage, IThreadResult } from '../../../definitions';
import messagesStatus from '../../../constants/messagesStatus';
import normalizeMessage from './normalizeMessage';

export default (message: Partial<IMessage> | IThreadResult): Partial<IMessage> | IThreadResult => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
