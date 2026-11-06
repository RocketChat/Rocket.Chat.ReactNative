import I18n from '~/i18n';
import { type IUpload } from '~/definitions';
import { HttpError } from './HttpError';
import { parseRetryAfterFromMessage } from './retryAfter';

const SERVER_ERROR_CODE = /\s*\[([\w-]+)\]$/;

const RETRYABLE_CLIENT_ERRORS = [401, 408, 429];

export type TUploadFailure = Pick<IUpload, 'errorStatus' | 'errorMessage'>;

export const getUploadFailure = (error: unknown): TUploadFailure =>
	error instanceof HttpError
		? { errorStatus: error.status, errorMessage: error.serverMessage ?? null }
		: { errorStatus: null, errorMessage: null };

export const isRetryableUploadError = (status: IUpload['errorStatus']): boolean =>
	status === undefined || status === null || status < 300 || status >= 500 || RETRYABLE_CLIENT_ERRORS.includes(status);

export const getUploadErrorMessage = ({ errorStatus, errorMessage }: TUploadFailure): string | undefined => {
	if (errorStatus === 413) {
		return I18n.t('error-file-too-large');
	}
	const fallback = isRetryableUploadError(errorStatus) ? undefined : I18n.t('FileUpload_Error');
	if (!errorMessage) {
		return fallback;
	}
	const code = errorMessage.match(SERVER_ERROR_CODE)?.[1] ?? errorMessage;
	if (code === 'error-too-many-requests') {
		const seconds = parseRetryAfterFromMessage(errorMessage);
		return seconds === undefined ? fallback : I18n.t(code, { seconds: String(seconds) });
	}
	if (!I18n.isTranslated(code)) {
		return errorMessage.replace(SERVER_ERROR_CODE, '') || fallback;
	}
	return I18n.t(code);
};
