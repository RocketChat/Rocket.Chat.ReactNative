import { Action } from 'redux';

import { IAppActionButton } from '../definitions';
import { APP_ACTION_BUTTON } from './actionsTypes';

export type IAppActionButtonsState = Record<string, IAppActionButton>;

interface ISetAppActionButtons extends Action {
	appActionButtons: IAppActionButtonsState;
}

interface IUpdateAppActionButtons extends Action {
	payload: { id: string; appActionButton: IAppActionButton };
}

interface IRemoveAppActionButtons extends Action {
	payload: { id: string };
}

export type TActionAppActionButtons = ISetAppActionButtons & IUpdateAppActionButtons & IRemoveAppActionButtons;

export function setAppActionButtons(appActionButtons: IAppActionButtonsState): ISetAppActionButtons {
	return {
		type: APP_ACTION_BUTTON.SET,
		appActionButtons
	};
}

export function updateAppActionButtons(id: string, appActionButton: IAppActionButton): IUpdateAppActionButtons {
	return {
		type: APP_ACTION_BUTTON.UPDATE,
		payload: { id, appActionButton }
	};
}

export function removeAppActionButtons(id: string): IRemoveAppActionButtons {
	return {
		type: APP_ACTION_BUTTON.REMOVE,
		payload: { id }
	};
}
