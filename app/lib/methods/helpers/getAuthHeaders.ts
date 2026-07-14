import sdk from '../../services/sdk';
import { isSameOrigin } from './isSameOrigin';

/**
 * Returns the request headers for a given URL.
 * On same-origin requests the full header set is sent (including the session token).
 * On cross-origin requests only the session token (X-Auth-Token/X-User-Id) is stripped,
 * keeping non-sensitive headers such as User-Agent (and Basic auth) — matching the
 * pre-migration behavior where only User-Agent/Basic auth were ever sent off-origin.
 */
export const getAuthHeaders = (url: string): Record<string, string> => {
	if (isSameOrigin(url, sdk.server)) {
		return sdk.getHeaders();
	}
	const headers = { ...sdk.getHeaders() };
	delete headers['X-Auth-Token'];
	delete headers['X-User-Id'];
	return headers;
};
