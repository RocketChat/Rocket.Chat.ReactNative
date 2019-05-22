import { TOGGLE_MARKDOWN } from '../actions/actionsTypes';

const initialState = {
	useMarkdown: true
};


export default (state = initialState, action) => {
	switch (action.type) {
		case TOGGLE_MARKDOWN:
			return {
				useMarkdown: action.payload
			};
		default:
			return state;
	}
};
