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

const notifyUnsupported = (result: Awaited<ReturnType<typeof triggerAction>>) => {
	if (result === ModalActions.UNSUPPORTED) {
		showToast(I18n.t('App_action_unsupported'));
	}
};

export async function triggerSubmitView({ viewId, ...options }: ITriggerSubmitView) {
	const result = await triggerAction({ type: ActionTypes.SUBMIT, viewId, ...options });
	notifyUnsupported(result);
	if (!result || ModalActions.CLOSE === result || ModalActions.UNSUPPORTED === result) {
		Navigation.back();
	}
}

export function triggerCancel({ view, ...options }: ITriggerCancel) {
	return triggerAction({ type: ActionTypes.CLOSED, view, ...options });
}

export async function triggerBlockAction(options: ITriggerBlockAction) {
	const result = await triggerAction({ type: ActionTypes.ACTION, ...options });
	notifyUnsupported(result);
	return result;
}
