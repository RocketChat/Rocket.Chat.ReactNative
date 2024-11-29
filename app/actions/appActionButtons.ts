import { Action } from 'redux';

import { APP_ACTION_BUTTON } from './actionsTypes';
import { IAppActionButtonsState } from '../reducers/appActionButtons';

interface ISetAppActionButtons extends Action {
	appActionButtons: IAppActionButtonsState;
}

interface IRemoveAppActionButtonsByAppId extends Action {
	payload: { appId: string };
}

export type TActionAppActionButtons = ISetAppActionButtons & IRemoveAppActionButtonsByAppId;

export function setAppActionButtons(appActionButtons: IAppActionButtonsState): ISetAppActionButtons {
	return {
		type: APP_ACTION_BUTTON.SET,
		appActionButtons
	};
}

export function removeAppActionButtonsByAppId(appId: string): IRemoveAppActionButtonsByAppId {
	return {
		type: APP_ACTION_BUTTON.REMOVE_BY_APPID,
		payload: { appId }
	};
}
