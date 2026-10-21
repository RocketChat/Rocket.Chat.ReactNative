import { UploadHttpError } from './fileUpload/UploadHttpError';
import { UploadNetworkError } from './fileUpload/UploadNetworkError';

export const isTransientUploadError = (error: unknown): boolean =>
	error instanceof UploadNetworkError || (error instanceof UploadHttpError && (error.status >= 500 || error.status === 429));
