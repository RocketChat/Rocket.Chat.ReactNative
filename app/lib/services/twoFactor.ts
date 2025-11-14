import { TWO_FACTOR } from '../../containers/TwoFactor';
import EventEmitter from '../methods/helpers/events';
import { type ICredentials } from '../../definitions';

interface ITwoFactor {
	method: string;
	invalid: boolean;
	params?: ICredentials;
}

export const twoFactor = ({ method, invalid, params }: ITwoFactor): Promise<{ twoFactorCode: string; twoFactorMethod: string }> =>
	new Promise((resolve, reject) => {
		EventEmitter.emit(TWO_FACTOR, {
			method,
			invalid,
			params,
			cancel: () => reject(),
			submit: (code: string) => {
				resolve({ twoFactorCode: code, twoFactorMethod: method });
			}
		});
	});
