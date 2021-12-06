import { settings } from '@rocket.chat/sdk';

import { TWO_FACTOR } from '../containers/TwoFactor';
import EventEmitter from './events';

export const twoFactor = ({
	method,
	invalid
}: {
	method: string;
	invalid: boolean;
}): Promise<{ twoFactorCode: string; twoFactorMethod: string }> =>
	new Promise((resolve, reject) => {
		EventEmitter.emit(TWO_FACTOR, {
			method,
			invalid,
			cancel: () => reject(),
			submit: (code: string) => {
				settings.customHeaders = {
					...settings.customHeaders,
					'x-2fa-code': code,
					'x-2fa-method': method
				};
				resolve({ twoFactorCode: code, twoFactorMethod: method });
			}
		});
	});
