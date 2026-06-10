import { Platform } from 'react-native';

import i18n from '../../../i18n';
import { type IAttachment } from '../../../definitions';
import { getAttachmentText } from '../utils';

// A quoted reply renders its text via a nested <Markdown> inside the message's single accessible
// Touchable. On iOS that subtree is merged into the parent accessibility element, so the quoted text
// is never exposed on its own; fold it into the message accessibility label so VoiceOver announces it,
// mirroring useImageDescriptionLabel. iOS-only: on Android TalkBack still enumerates the quote subtree,
// so adding the suffix there would double-announce the quote.
export const useQuoteDescriptionLabel = (attachments: IAttachment[] | undefined): string => {
	if (Platform.OS !== 'ios') {
		return '';
	}

	const quotedText = attachments
		?.filter(attachment => !!attachment.message_link)
		.map(attachment => getAttachmentText(attachment)?.trim())
		.find(text => !!text);

	if (!quotedText) {
		return '';
	}

	return `${i18n.t('Quote')}: ${quotedText}`;
};
