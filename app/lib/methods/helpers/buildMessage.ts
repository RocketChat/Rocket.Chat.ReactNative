import { ILastMessage, IMessage, IThreadResult } from '../../../definitions';
import { messagesStatus } from '../../constants';
import normalizeMessage from './normalizeMessage';

export default (message: Partial<IMessage> | IThreadResult | ILastMessage): IMessage | IThreadResult | null => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
