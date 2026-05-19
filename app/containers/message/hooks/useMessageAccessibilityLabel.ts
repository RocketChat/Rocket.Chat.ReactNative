import i18n from '../../../i18n';
import translationLanguages from '../../../lib/constants/translationLanguages';
import { useImageDescriptionLabel } from './useImageDescriptionLabel';
import { type IMessage, type IMessageTouchable } from '../interfaces';
import { getInfoMessage } from '../utils';

const stripMentions = (label: string, mentions: IMessage['mentions'] = [], channels: IMessage['channels'] = []) => {
	let result = label;
	mentions.forEach(item => {
		if (item?.username) {
			result = result.replaceAll(`@${item.username}`, item.username);
		}
	});
	channels.forEach(item => {
		if (item?.name) {
			result = result.replaceAll(`#${item.name}`, item.name);
		}
	});
	return result;
};

export const useMessageAccessibilityLabel = (props: IMessage & IMessageTouchable): string => {
	const imageDescriptionLabel = useImageDescriptionLabel(props.attachments, props.msg);

	const threadMessageLabel = i18n.t('Thread_message', { msg: props.msg });
	let label = props.isInfo ? (props.msg as string) : `${props.tmid ? threadMessageLabel : props.msg}`;
	if (props.isThreadReply) {
		label = i18n.t('Thread_reply', { msg: props.tmid ? threadMessageLabel : props.msg });
	}
	if (props.isThreadSequential) {
		label = threadMessageLabel;
	}
	if (props.isEncrypted) {
		label = i18n.t('Encrypted_message');
	}
	if (props.isInfo) {
		// @ts-ignore
		label = getInfoMessage({ ...props });
	}
	label = stripMentions(label, props.mentions, props.channels);

	const hour = props.ts ? new Date(props.ts).toLocaleTimeString() : '';
	const user = props.useRealName ? props.author?.name : props.author?.username || '';
	const readOrUnreadLabel = !props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
	const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
	const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
	const translatedLanguage = translationLanguages[props?.autoTranslateLanguage || 'en'];
	const translated = props.isTranslated ? i18n.t('Message_translated_into_idiom', { idiom: translatedLanguage }) : '';
	// For translated messages, the translated body is announced by the inner A11y.Index node, so the outer label
	// only carries the metadata (user, hour, translated marker) and the suffix (image description, encryption, read receipt).
	const prefix = props.isTranslated
		? [user, hour, translated].filter(Boolean).join(' ')
		: [user, hour, translated, label].filter(Boolean).join(' ');
	const suffix = [imageDescriptionLabel, encryptedMessageLabel, readReceipt].filter(Boolean).join(' ');
	return suffix ? `${prefix}. ${suffix}` : `${prefix}.`;
};
