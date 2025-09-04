import { settings } from '@rocket.chat/sdk';

const remove2FAHeaders = () => {
	if (settings?.customHeaders) {
		const { 'x-2fa-code': _, 'x-2fa-method': __, ...rest } = settings.customHeaders;
		settings.customHeaders = rest;
	}
};

export default remove2FAHeaders;
