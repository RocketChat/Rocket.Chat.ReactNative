import {
	ActionTypes,
	type ITriggerBlockAction,
	type ITriggerCancel,
	type ITriggerSubmitView,
	ModalActions
} from '~/containers/UIKit/interfaces';
import I18n from '~/i18n';
import { showToast } from '~/lib/methods/helpers/showToast';
import Navigation from '~/lib/navigation/appNavigation';
import { triggerAction } from './actions';

export const notifyUnsupported = <T>(result: T): T => {
	if (result === ModalActions.UNSUPPORTED) {
		showToast(I18n.t('App_action_unsupported'));
	}
	return result;
};

export async function triggerSubmitView({ viewId, ...options }: ITriggerSubmitView) {
	const result = notifyUnsupported(await triggerAction({ type: ActionTypes.SUBMIT, viewId, ...options }));
	if (!result || ModalActions.CLOSE === result) {
		Navigation.back();
	}
}

export function triggerCancel({ view, ...options }: ITriggerCancel) {
	return triggerAction({ type: ActionTypes.CLOSED, view, ...options });
}

export async function triggerBlockAction(options: ITriggerBlockAction) {
	return notifyUnsupported(await triggerAction({ type: ActionTypes.ACTION, ...options }));
}
