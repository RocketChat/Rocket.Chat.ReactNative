import { settings } from '@rocket.chat/sdk';

import { TWO_FACTOR } from '../../constants/twoFactor';
import EventEmitter from '../../methods/helpers/events';
import { type ILoginCredentials } from '../../../definitions';
import { TwoFactorCancelledError } from './twoFactorCancelled';
import { TwoFactorUnavailableError } from './twoFactorUnavailable';

interface ITwoFactor {
	method: string;
	invalid: boolean;
	params?: ILoginCredentials;
}

export interface ITwoFactorPrompt {
	method: string;
	invalid: boolean;
	params?: ILoginCredentials;
	submit: (code: string) => void;
}

let activeRequest: { reject: (error: Error) => void } | null = null;
let presenters = 0;

export const cancelActiveRequest = () => {
	const request = activeRequest;
	activeRequest = null;
	request?.reject(new TwoFactorCancelledError());
};

export const subscribeToTwoFactorPrompts = (present: (prompt: ITwoFactorPrompt) => void) => {
	const listener = EventEmitter.addEventListener(TWO_FACTOR, present);
	presenters += 1;

	return () => {
		EventEmitter.removeListener(TWO_FACTOR, listener);
		presenters -= 1;
		queueMicrotask(() => {
			if (presenters === 0) {
				cancelActiveRequest();
			}
		});
	};
};

export const twoFactor = ({ method, invalid, params }: ITwoFactor): Promise<{ twoFactorCode: string; twoFactorMethod: string }> =>
	new Promise((resolve, reject) => {
		cancelActiveRequest();

		if (presenters === 0) {
			reject(new TwoFactorUnavailableError());
			return;
		}

		const request = { reject };
		activeRequest = request;

		EventEmitter.emit(TWO_FACTOR, {
			method,
			invalid,
			params,
			submit: (code: string) => {
				if (activeRequest === request) {
					activeRequest = null;
				}
				settings.customHeaders = {
					...settings.customHeaders,
					'x-2fa-code': code,
					'x-2fa-method': method
				};
				resolve({ twoFactorCode: code, twoFactorMethod: method });
			}
		});
	});
