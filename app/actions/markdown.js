import * as types from './actionsTypes';

export function toggleMarkdown(value) {
	return {
		type: types.TOGGLE_MARKDOWN,
		payload: value
	};
}
