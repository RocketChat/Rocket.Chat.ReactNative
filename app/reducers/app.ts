import { TActionApp } from '../actions/app';
import { RootEnum } from '../definitions';
import { APP, APP_STATE } from '../actions/actionsTypes';

export interface IApp {
	root?: RootEnum;
	isMasterDetail: boolean;
	text?: string;
	ready: boolean;
	foreground: boolean;
	background: boolean;
	notificationPresenceCap: boolean;
}

export const initialState: IApp = {
	root: undefined,
	isMasterDetail: false,
	text: undefined,
	ready: false,
	foreground: true,
	background: false,
	notificationPresenceCap: false
};

export default function app(state = initialState, action: TActionApp): IApp {
	switch (action.type) {
		case APP_STATE.FOREGROUND:
			return {
				...state,
				foreground: true,
				background: false
			};
		case APP_STATE.BACKGROUND:
			return {
				...state,
				foreground: false,
				background: true
			};
		case APP.START:
			return {
				...state,
				root: action.root,
				text: action.text
			};
		case APP.INIT:
			return {
				...state,
				ready: false
			};
		case APP.READY:
			return {
				...state,
				ready: true
			};
		case APP.SET_MASTER_DETAIL:
			return {
				...state,
				isMasterDetail: action.isMasterDetail
			};
		case APP.SET_NOTIFICATION_PRESENCE_CAP:
			return {
				...state,
				notificationPresenceCap: action.show
			};
		default:
			return state;
	}
}
