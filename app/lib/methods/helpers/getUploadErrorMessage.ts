import I18n from '~/i18n';
import { isRetryableUploadError } from './isRetryableUploadError';
import { parseRetryAfterFromMessage } from './parseRetryAfterFromMessage';

const SERVER_ERROR_CODE = /\s*\[([\w-]+)\]$/;

export const getUploadErrorMessage = ({
	errorStatus,
	errorMessage
}: {
	errorStatus?: number | null;
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
	const key = errorMessage.match(SERVER_ERROR_CODE)?.[1] ?? errorMessage;
	if (!I18n.isTranslated(key)) {
		return errorMessage.replace(SERVER_ERROR_CODE, '') || fallback;
	}
	return I18n.t(key);
};
