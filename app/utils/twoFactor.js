import { settings } from '@rocket.chat/sdk';

import I18n from '../i18n';
import EventEmitter from './events';
import { TWO_FACTOR } from '../containers/TwoFactor';

export const twoFactor = ({ method, invalid }) => new Promise((resolve, reject) => {
	EventEmitter.emit(TWO_FACTOR, {
		method,
		invalid,
		cancel: {
			text: I18n.t('Cancel'),
			onPress: () => reject()
		},
		submit: {
			text: 'Verify',
			onPress: (code) => {
				settings.customHeaders = {
					...settings.customHeaders,
					'x-2fa-code': code,
					'x-2fa-method': method
				};
				resolve({ twoFactorCode: code, twoFactorMethod: method });
			}
		}
	});
});
