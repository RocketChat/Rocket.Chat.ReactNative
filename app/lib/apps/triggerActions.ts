import type { UserInteraction } from '@rocket.chat/ui-kit';

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
import { type IAppActionButton, UIActionButtonContext } from './definitions';
import { ACKNOWLEDGED, postUserInteraction, triggerAction } from './actions';

export async function triggerSubmitView({ viewId, ...options }: ITriggerSubmitView): Promise<boolean> {
	const result = await triggerAction({ type: ActionTypes.SUBMIT, viewId, ...options });
	return result === ModalActions.CLOSE || result === ACKNOWLEDGED;
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
		if (!rid) {
			throw new Error('rid is required for actionButton interaction');
		}
		const { actionId, appId, context } = button;
		await postUserInteraction(appId, (triggerId): UserInteraction => {
			if (context === UIActionButtonContext.ROOM_ACTION) {
				return { type: 'actionButton', actionId, rid, triggerId, payload: { context } };
			}
			if (context === UIActionButtonContext.MESSAGE_BOX_ACTION) {
				return { type: 'actionButton', actionId, rid, tmid, triggerId, payload: { context, message: message ?? '' } };
			}
			throw new Error(`Unsupported actionButton context: ${context}`);
		});
	} catch (e) {
		log(e);
		showToast(I18n.t('App_action_error'));
	}
}
