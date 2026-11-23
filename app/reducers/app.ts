import { type NetInfoStateType } from '@react-native-community/netinfo';

import { type TActionApp } from '../actions/app';
import { type RootEnum } from '../definitions/redux/TRootEnum';
import { APP, APP_STATE } from '../actions/actionsTypes';

export interface IApp {
	root?: RootEnum;
	text?: string;
	foreground: boolean;
	background: boolean;
	notificationPresenceCap: boolean;
	netInfoState?: NetInfoStateType | null;
}

export const initialState: IApp = {
	root: undefined,
	text: undefined,
	foreground: true,
	background: false,
	notificationPresenceCap: false,
	netInfoState: null
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
		case APP.SET_NOTIFICATION_PRESENCE_CAP:
			return {
				...state,
				notificationPresenceCap: action.show
			};
		case APP.SET_NET_INFO_STATE:
			return {
				...state,
				netInfoState: action.netInfoState
			};
		default:
			return state;
	}
}
