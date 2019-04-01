import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';
import { APP } from '../actions/actionsTypes';

const initialState = {
	root: null,
	starting: true,
	ready: false,
	inactive: false,
	background: false
};

export default function app(state = initialState, action) {
	switch (action.type) {
		case FOREGROUND:
			return {
				...state,
				inactive: false,
				foreground: true,
				background: false
			};
		case BACKGROUND:
			return {
				...state,
				inactive: false,
				foreground: false,
				background: true
			};
		case INACTIVE:
			return {
				...state,
				inactive: true,
				foreground: false,
				background: false
			};
		case APP.START:
			return {
				...state,
				root: action.root
			};
		case APP.INIT:
			return {
				...state,
				ready: false,
				starting: true
			};
		case APP.READY:
			return {
				...state,
				ready: true,
				starting: false
			};
		default:
			return state;
	}
}
