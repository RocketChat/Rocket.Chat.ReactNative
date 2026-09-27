import I18n from '~/i18n';
import { parseRetryAfterFromMessage } from './fileUpload/definitions';

// Fallback copy for statuses whose server message isn't reliable/descriptive on its own (e.g. a proxy may reject
// an oversized upload before it reaches the app, with no usable body). Not every status in isRetryableUploadError's
// permanent-failure set needs an entry here - the rest fall through to the server's own (translated) message below.
const STATUS_MESSAGES: Record<number, string> = {
	413: 'error-file-too-large'
};

export const getUploadErrorMessage = ({
	errorStatus,
	errorMessage
}: {
	errorStatus?: number;
	errorMessage?: string;
}): string | undefined => {
	const key = errorStatus !== undefined ? STATUS_MESSAGES[errorStatus] : undefined;
	if (key) {
		return I18n.t(key);
	}
	if (!errorMessage) {
		return undefined;
	}
	if (errorMessage.includes('error-file-too-large')) {
		return I18n.t('error-file-too-large');
	}
	if (errorMessage.includes('error-too-many-requests')) {
		const seconds = parseRetryAfterFromMessage(errorMessage);
		return seconds !== undefined ? I18n.t('error-too-many-requests', { seconds: String(seconds) }) : undefined;
	}
	if (!I18n.isTranslated(errorMessage)) {
		return errorMessage;
	}
	const translated = I18n.t(errorMessage);
	return typeof translated === 'string' ? translated : errorMessage;
};
