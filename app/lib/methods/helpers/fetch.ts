import sdk from '../../services/sdk';
import { type DefaultHeaders, headers } from './defaultHeaders';
import { getAuthHeaders } from './getAuthHeaders';

export type TMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'post' | 'get' | 'delete' | 'put';

interface IOptions {
	headers?: DefaultHeaders;
	signal?: AbortSignal;
	method?: TMethods;
	body?: any;
}

export { headers };

export const setBasicAuth = (basicAuth: string | null, server?: string): void => {
	sdk.setBasicAuth(basicAuth, server);
};

export const BASIC_AUTH_KEY = 'BASIC_AUTH_KEY';

export default (url: string, options: IOptions = {}): Promise<Response> => {
	const authHeaders = getAuthHeaders(url);
	const customOptions = { ...options, headers: { ...authHeaders, ...(options.headers || {}) } };
	return fetch(url, customOptions);
};
