import { type ILastMessage, type IMessage, type IThreadResult } from '../../../definitions';
import { messagesStatus } from '../../constants/messagesStatus';
import normalizeMessage from './normalizeMessage';

export default (message: Partial<IMessage> | IThreadResult | ILastMessage): IMessage | IThreadResult | null => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
