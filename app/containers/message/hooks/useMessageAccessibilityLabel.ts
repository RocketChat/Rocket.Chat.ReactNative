import i18n from '../../../i18n';
import translationLanguages from '../../../lib/constants/translationLanguages';
import { useImageDescriptionLabel } from './useImageDescriptionLabel';
import { getInfoMessage } from '../utils';
import { type IUserChannel, type IUserMention } from '../../../definitions';
import { formatChannelMentions } from '../../../lib/methods/helpers/formatChannelMentions';
import {
	useContentData,
	useIsEncrypted,
	useIsInfoMessage,
	useMessageAuthor,
	useMessageHeaderMeta,
	useMessageText,
	useThreadData,
	useThreadPosition
} from '../stores/MessageStore';
import { useAutoTranslate, useIsReadReceiptEnabled } from '../stores/MessageRoomStore';
import { useSetting } from '../../../lib/hooks/useSetting';

const stripMentions = (label: string, mentions: IUserMention[] = [], channels: IUserChannel[] = []) => {
	let result = label;
	mentions?.forEach(item => {
		if (item?.username) {
			result = result.replaceAll(`@${item.username}`, item.username);
		}
	});
	return formatChannelMentions(result, channels, true);
};

export const useMessageAccessibilityLabel = (): string => {
	const useRealName = useSetting('UI_Use_Real_Name') as boolean;
	const { autoTranslateLanguage } = useAutoTranslate();
	const { attachments, mentions, channels, comment, t: type } = useContentData();
	const { u: author, role } = useMessageAuthor();
	const { messageText, isTranslated } = useMessageText();
	const { tmid } = useThreadData();
	const { isThreadReply, isThreadSequential } = useThreadPosition();
	const isInfo = useIsInfoMessage();
	const isEncrypted = useIsEncrypted();
	const { ts, unread } = useMessageHeaderMeta();
	const isReadReceiptEnabled = useIsReadReceiptEnabled();

	const imageDescriptionLabel = useImageDescriptionLabel(attachments, messageText);
	const msg = messageText || '';
	const threadMessageLabel = i18n.t('Thread_message', { msg });
	let label = isInfo ? msg : `${tmid ? threadMessageLabel : msg}`;
	if (isThreadReply) {
		label = i18n.t('Thread_reply', { msg: tmid ? threadMessageLabel : msg });
	}
	if (isThreadSequential) {
		label = threadMessageLabel;
	}
	if (isEncrypted) {
		label = i18n.t('Encrypted_message');
	}
	if (isInfo) {
		label = getInfoMessage({ type, role, msg, author, comment });
	}
	label = stripMentions(label, mentions, channels);

	const hour = ts ? new Date(ts).toLocaleTimeString() : '';
	const user = useRealName ? author?.name : author?.username || '';
	const readOrUnreadLabel = !unread && unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
	const readReceipt = isReadReceiptEnabled && !isInfo ? readOrUnreadLabel : '';
	const encryptedMessageLabel = isEncrypted ? i18n.t('Encrypted_message') : '';
	const translatedLanguage = translationLanguages[autoTranslateLanguage || 'en'];
	const translated = isTranslated ? i18n.t('Message_translated_into_idiom', { idiom: translatedLanguage }) : '';
	// For translated messages, the translated body is announced by the inner A11y.Index node, so the outer label
	// only carries the metadata (user, hour, translated marker) and the suffix (image description, encryption, read receipt).
	const prefix = isTranslated
		? [user, hour, translated].filter(Boolean).join(' ')
		: [user, hour, translated, label].filter(Boolean).join(' ');
	const suffix = [imageDescriptionLabel, encryptedMessageLabel, readReceipt].filter(Boolean).join(' ');
	return suffix ? `${prefix}. ${suffix}` : `${prefix}.`;
};
