import {
	ActionTypes,
	type ITriggerBlockAction,
	type ITriggerCancel,
	type ITriggerSubmitView,
	ModalActions
} from '~/containers/UIKit/interfaces';
import I18n from '~/i18n';
import { showToast } from '~/lib/methods/helpers/showToast';
import log from '~/lib/methods/helpers/log';
import { type IAppActionButton } from './definitions';
import { triggerAction } from './actions';

export async function triggerSubmitView({ viewId, ...options }: ITriggerSubmitView): Promise<boolean> {
	const result = await triggerAction({ type: ActionTypes.SUBMIT, viewId, ...options });
	return ModalActions.CLOSE === result;
}

export function triggerCancel({ view, ...options }: ITriggerCancel) {
	return triggerAction({ type: ActionTypes.CLOSED, view, ...options });
}

export function triggerBlockAction(options: ITriggerBlockAction) {
	return triggerAction({ type: ActionTypes.ACTION, ...options });
}

interface ITriggerAppActionButton {
	button: IAppActionButton;
	rid?: string;
	tmid?: string;
	message?: string;
}

export async function triggerAppActionButton({ button, rid, tmid, message }: ITriggerAppActionButton) {
	try {
		await triggerAction({
			type: ActionTypes.ACTION_BUTTON,
			actionId: button.actionId,
			appId: button.appId,
			rid,
			tmid,
			payload: { context: button.context, message }
		});
	} catch (e) {
		log(e);
		showToast(I18n.t('App_action_error'));
	}
}
