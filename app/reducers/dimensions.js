import { Dimensions } from 'react-native';
import { DIMENSIONS } from '../actions/actionsTypes';

const initialState = Dimensions.get('window');

export default function(state = initialState, action) {
	switch (action.type) {
		case DIMENSIONS.WINDOW:
			return {
				...state,
				scale: action.window.scale,
				width: action.window.width,
				height: action.window.height,
				fontScale: action.window.fontScale
			};
		default:
			return state;
	}
}
