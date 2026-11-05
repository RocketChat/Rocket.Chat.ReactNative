import I18n from '~/i18n';
import { getServerError } from '~/lib/methods/helpers/getServerError';
import { isTwoFactorCancelled } from '~/lib/services/twoFactor/twoFactorCancelled';

export const handleError = (e: any, action: string) => {
	if (isTwoFactorCancelled(e)) {
		throw e;
	}
	if (e.data?.error?.includes('[error-too-many-requests]')) {
		throw new Error(e.data.error);
	}
	const { code, details } = getServerError(e);
	if (code === 'error-avatar-invalid-url') {
		throw new Error(I18n.t(code, { url: details?.url }));
	}
	if (code && I18n.isTranslated(code)) {
		const message = I18n.t(code, { action: I18n.t(action) });
		throw new Error(message.charAt(0).toUpperCase() + message.slice(1));
	}
	throw new Error(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
};
