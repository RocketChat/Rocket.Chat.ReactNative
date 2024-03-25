import customHeaders, { ICustomHeaders } from '../customHeaders';

export type TMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'post' | 'get' | 'delete' | 'put';

export const BASIC_AUTH_KEY = 'BASIC_AUTH_KEY';

interface IOptions {
	headers?: ICustomHeaders;
	method?: TMethods;
	body?: any;
}

export const setBasicAuth = (basicAuth: string | null): void => {
	if (basicAuth) {
		customHeaders.setHeaders({ Authorization: `Basic ${basicAuth}` });
	} else {
		customHeaders.resetHeaders();
	}
};

export default (url: string, options: IOptions = {}): Promise<Response> => {
	let customOptions = { ...options, headers: customHeaders.getHeaders() };
	if (options && options.headers) {
		customOptions = { ...customOptions, headers: { ...options.headers, ...customOptions.headers } };
	}

	return fetch(url, customOptions);
};
