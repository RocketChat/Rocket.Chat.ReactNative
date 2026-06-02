import i18n from '../../../i18n';
import { type IAttachment } from '../../../definitions';

// A quoted reply renders its text via a nested <Markdown> inside the message's single accessible
// Touchable. On iOS that subtree is merged into the parent accessibility element, so the quoted
// text is never exposed on its own (on Android the raw text node is still enumerated). Fold it into
// the message accessibility label so VoiceOver announces it, mirroring useImageDescriptionLabel.
export const useQuoteDescriptionLabel = (attachments: IAttachment[] | undefined): string => {
	const quotedText = attachments
		?.filter(attachment => !!attachment.message_link)
		.map(attachment => (attachment.text || attachment.title)?.trim())
		.find(text => !!text);

	if (!quotedText) {
		return '';
	}

	return `${i18n.t('Quote')}: ${quotedText}`;
};
