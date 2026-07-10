import i18n from '../../../i18n';
import { useAltTextSupported } from '../../../lib/hooks/useAltTextSupported';
import { type IAttachment } from '../../../definitions';

export const useImageDescriptionLabel = (attachments: IAttachment[] | undefined, msg: string | undefined): string => {
	'use memo';

	const isAltTextSupported = useAltTextSupported();
	if (isAltTextSupported) {
		return '';
	}

	const imageAltText = attachments
		?.filter(attachment => attachment.image_url)
		.map(attachment => (attachment.altText || attachment.description)?.trim())
		.find(text => !!text);

	if (!imageAltText || imageAltText === msg?.trim()) {
		return '';
	}

	return `${i18n.t('Image_description')}: ${imageAltText}`;
};
