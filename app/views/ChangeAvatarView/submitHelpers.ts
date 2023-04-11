import I18n from '../../i18n';

export const handleError = (e: any, action: string) => {
	if (e.data && e.data.error.includes('[error-too-many-requests]')) {
		throw new Error(e.data.error);
	}
	if (e.error && e.error === 'error-avatar-invalid-url') {
		throw new Error(I18n.t(e.error, { url: e.details.url }));
	}
	if (I18n.isTranslated(e.error)) {
		throw new Error(I18n.t(e.error));
	}
	throw new Error(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
};
