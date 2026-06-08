import sdk from '../../services/sdk';
import { type DefaultHeaders, headers } from './defaultHeaders';

export type TMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'post' | 'get' | 'delete' | 'put';

interface IOptions {
	headers?: DefaultHeaders;
	signal?: AbortSignal;
	method?: TMethods;
	body?: any;
}

export { headers };

export const setBasicAuth = (basicAuth: string | null): void => {
	sdk.setBasicAuth(basicAuth);
};

export const BASIC_AUTH_KEY = 'BASIC_AUTH_KEY';

export default (url: string, options: IOptions = {}): Promise<Response> => {
	const customOptions = { ...options, headers: { ...sdk.getHeaders(), ...(options.headers || {}) } };
	return fetch(url, customOptions);
};

