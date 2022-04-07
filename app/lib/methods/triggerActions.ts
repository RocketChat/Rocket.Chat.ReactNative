import { ActionTypes, ITriggerCancel, ITriggerSubmitView, ModalActions } from '../../containers/UIKit/interfaces';
import Navigation from '../navigation/appNavigation';
import { triggerAction } from './actions';

export async function triggerSubmitView({ viewId, ...options }: ITriggerSubmitView) {
	const result = await triggerAction({ type: ActionTypes.SUBMIT, viewId, ...options });
	if (!result || ModalActions.CLOSE === result) {
		Navigation.back();
	}
}

export function triggerCancel({ view, ...options }: ITriggerCancel) {
	return triggerAction({ type: ActionTypes.CLOSED, view, ...options });
}
