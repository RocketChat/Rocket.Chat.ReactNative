import { store } from '../../store/auxStore';
import { IAttachment, IAttachmentTranslations, IMessage } from '../../../definitions';
import { getAvatarURL } from '../../methods/helpers';

export function createQuoteAttachment(message: IMessage, messageLink: string): IAttachment {
	const { server, version: serverVersion } = store.getState().server;
	const avatarExternalProviderUrl = (store.getState().settings?.Accounts_AvatarExternalProviderUrl as string) || '';

	return {
		text: message.msg,
		// this type is wrong
		...('translations' in message && { translations: message?.translations as unknown as IAttachmentTranslations }),
		message_link: messageLink,
		author_name: message.alias || message.u.username,
		author_icon: getAvatarURL({
			avatar: message.u?.username && `/avatar/${message.u?.username}`,
			type: message.t,
			userId: message.u?._id,
			server,
			serverVersion,
			avatarExternalProviderUrl
		}),
		attachments: message.attachments || [],
		ts: message.ts
	};
}
