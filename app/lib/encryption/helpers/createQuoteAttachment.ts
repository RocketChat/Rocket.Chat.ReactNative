import { store } from '../../store/auxStore';
import { IAttachment, IMessage } from '../../../definitions';
import { getAvatarURL } from '../../methods/helpers';

export function createQuoteAttachment(message: IMessage, messageLink: string): IAttachment {
	const { server, version: serverVersion } = store.getState().server;
	const externalProviderUrl = (store.getState().settings?.Accounts_AvatarExternalProviderUrl as string) || '';

	return {
		text: message.msg,
		...('translations' in message && { translations: message?.translations }),
		message_link: messageLink,
		author_name: message.alias || message.u.username,
		author_icon: getAvatarURL({
			avatar: message.u?.username && `/avatar/${message.u?.username}`,
			type: message.t,
			userId: message.u?._id,
			server,
			serverVersion,
			externalProviderUrl
		}),
		attachments: message.attachments || [],
		ts: message.ts
	};
}
