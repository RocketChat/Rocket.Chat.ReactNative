import sdk from '../../services/sdk';
import { type CustomHeaders, headers, BASIC_AUTH_KEY } from './defaultHeaders';

export type TMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'post' | 'get' | 'delete' | 'put';

export { headers, BASIC_AUTH_KEY };

interface IOptions {
	headers?: CustomHeaders;
	signal?: AbortSignal;
	method?: TMethods;
	body?: any;
}

export const setBasicAuth = (basicAuth: string | null): void => {
	sdk.setBasicAuth(basicAuth);
};

export default (url: string, options: IOptions = {}): Promise<Response> => {
	const customOptions = { ...options, headers: { ...sdk.getHeaders(), ...(options.headers || {}) } };
	return fetch(url, customOptions);
};
