import { type ILastMessage, type IMessage } from '~/definitions/IMessage';
import { type IThreadResult } from '~/definitions/IThread';
import { messagesStatus } from '~/lib/constants/messagesStatus';
import normalizeMessage from './normalizeMessage';

export default (message: Partial<IMessage> | IThreadResult | ILastMessage): IMessage | IThreadResult | null => {
	message.status = messagesStatus.SENT;
	return normalizeMessage(message);
};
