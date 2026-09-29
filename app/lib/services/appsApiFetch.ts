import fetch from '../methods/helpers/fetch';
import sdk from './sdk';

// The Apps REST API lives under /api/apps, outside the /api/v1 prefix the sdk adds.
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
		throw new Error(`Failed to ${init.method} /api/apps/${path}: ${response.status}`);
	}

	return response;
};
