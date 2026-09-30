import fetch from '../methods/helpers/fetch';
import sdk from './sdk';

export class AppsApiError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
	}
}

export const appsApiFetch = async (
	path: string,
	init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' }
): Promise<Response> => {
	const { host, currentLogin } = sdk;
	if (!host || !currentLogin) {
		throw new Error('The Apps REST API requires an initialized, authenticated session');
	}
	const { userId, authToken } = currentLogin;

	const response = await fetch(`${host}/api/apps/${path}`, {
		method: init.method,
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId
		},
		body: init.body === undefined ? undefined : JSON.stringify(init.body)
	});

	if (!response.ok) {
		throw new AppsApiError(`Failed to ${init.method} /api/apps/${path}: ${response.status}`, response.status);
	}

	return response;
};
