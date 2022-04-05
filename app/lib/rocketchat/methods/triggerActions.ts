import {
	ActionTypes,
	ITriggerBlockAction,
	ITriggerCancel,
	ITriggerSubmitView,
	ModalActions
} from '../../../containers/UIKit/interfaces';
import { TRocketChat } from '../../../definitions';
import { triggerAction } from '../../methods/actions';
import Navigation from '../../Navigation';

export function triggerBlockAction(this: TRocketChat, options: ITriggerBlockAction) {
	return triggerAction.call(this, { type: ActionTypes.ACTION, ...options });
}

export async function triggerSubmitView(this: TRocketChat, { viewId, ...options }: ITriggerSubmitView) {
	const result = await triggerAction.call(this, { type: ActionTypes.SUBMIT, viewId, ...options });
	if (!result || ModalActions.CLOSE === result) {
		Navigation.back();
	}
}

export function triggerCancel(this: TRocketChat, { view, ...options }: ITriggerCancel) {
	return triggerAction.call(this, { type: ActionTypes.CLOSED, view, ...options });
}
