import * as types from './actionsTypes';

export function setJitsiBaseUrl(baseUrl) {
	return {
		type: types.JITSI.SET_BASE_URL,
		baseUrl
	};
}
