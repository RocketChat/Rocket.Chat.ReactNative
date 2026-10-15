import I18n from '~/i18n';
import { parseRetryAfterFromMessage } from './fileUpload/definitions';
import { isRetryableUploadError } from './isRetryableUploadError';

export const getUploadErrorMessage = ({
	errorStatus,
	errorMessage
}: {
	errorStatus?: number;
	errorMessage?: string;
}): string | undefined => {
	if (errorStatus === 413 || errorMessage?.includes('error-file-too-large')) {
		return I18n.t('error-file-too-large');
	}
	const fallback = isRetryableUploadError(errorStatus) ? undefined : I18n.t('FileUpload_Error');
	if (!errorMessage) {
		return fallback;
	}
	if (errorMessage.includes('error-too-many-requests')) {
		const seconds = parseRetryAfterFromMessage(errorMessage);
		return seconds === undefined ? fallback : I18n.t('error-too-many-requests', { seconds: String(seconds) });
	}
	if (!I18n.isTranslated(errorMessage)) {
		return errorMessage;
	}
	const translated = I18n.t(errorMessage);
	return typeof translated === 'string' ? translated : errorMessage;
};
