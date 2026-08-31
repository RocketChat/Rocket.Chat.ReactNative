import { type IMessage } from '../../definitions';
import { Encryption } from '../encryption';
import sdk from '../services/sdk';

export const editMessage = async (message: Pick<IMessage, 'id' | 'msg' | 'rid' | 'content'>) => {
	const result = await Encryption.encryptMessage(message as IMessage);
	if (!result) {
		throw new Error('Failed to encrypt message');
	}

	if (result.content) {
		// RC 0.49.0
		return sdk.post('chat.update', {
			roomId: message.rid,
			msgId: message.id,
			content: result.content
		});
	}

	// RC 0.49.0
	return sdk.post('chat.update', {
		roomId: message.rid,
		msgId: message.id,
		text: message.msg || ''
	});
};
