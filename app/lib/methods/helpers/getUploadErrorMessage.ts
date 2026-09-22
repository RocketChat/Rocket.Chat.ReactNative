import I18n from '~/i18n';

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
	if (errorMessage.includes('[error-file-too-large]')) {
		return I18n.t('error-file-too-large');
	}
	if (errorMessage.includes('[error-too-many-requests]')) {
		return I18n.t('error-too-many-requests', { seconds: errorMessage.replace(/\D/g, '') });
	}
	return I18n.isTranslated(errorMessage) ? I18n.t(errorMessage) : errorMessage;
};
