import * as types from './actionsTypes';

export function deepLinkingOpen(params) {
	return {
		type: types.DEEP_LINKING.OPEN,
		params
	};
}
