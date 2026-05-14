import { type IUserChannel } from '../../containers/markdown/interfaces';
import { type IMessage, type IMessageTouchable } from '../../containers/message/interfaces';
import { getInfoMessage } from '../../containers/message/utils';
import { type IUserMention } from '../../definitions';
import i18n from '../../i18n';
import translationLanguages from '../constants/translationLanguages';

type Params = IMessageTouchable & IMessage;

const replaceMentions = (label: string, mentions: IUserMention[] = [], channels: IUserChannel[] = []) => {
	mentions.forEach(item => {
		if (item?.username) {
			label = label.replaceAll(`@${item.username}`, item.username);
		}
	});
	channels.forEach(item => {
		if (item?.name) {
			label = label.replaceAll(`#${item.name}`, item.name);
		}
	});
	return label;
};

export const buildMessageAccessibilityLabel = (props: Params): string => {
	let label = '';
	label = props.isInfo ? (props.msg as string) : `${props.tmid ? `thread message ${props.msg}` : props.msg}`;
	if (props.isThreadReply) {
		label = `replying to ${props.tmid ? `thread message ${props.msg}` : props}`;
	}
	if (props.isThreadSequential) {
		label = `thread message ${props.msg}`;
	}
	if (props.isEncrypted) {
		label = i18n.t('Encrypted_message');
	}
	if (props.isInfo) {
		// @ts-ignore
		label = getInfoMessage({ ...props });
	}
	label = replaceMentions(label, props.mentions, props.channels);

	const hour = props.ts ? new Date(props.ts).toLocaleTimeString() : '';
	const user = props.useRealName ? props.author?.name : props.author?.username || '';
	const readOrUnreadLabel = !props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
	const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
	const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
	const translatedLanguage = translationLanguages[props?.autoTranslateLanguage || 'en'];
	const translated = props.isTranslated ? i18n.t('Message_translated_into_idiom', { idiom: translatedLanguage }) : '';
	const isThread = !props.isInfo && !!(props.tmid || props.tcount || props.isThreadReply || props.isThreadSequential);
	const threadHint = isThread ? `. ${i18n.t('A11y_press_to_view_thread')}` : '';
	return props.isTranslated
		? `${user} ${hour} ${translated}${threadHint}`
		: `${user} ${hour} ${translated} ${label}. ${encryptedMessageLabel} ${readReceipt}${threadHint}`;
};

export const useMessageAccessibilityLabel = (props: Params): string => {
	'use memo';

	return buildMessageAccessibilityLabel(props);
};
