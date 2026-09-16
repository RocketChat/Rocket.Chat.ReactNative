import { type IAppActionButton } from './definitions';
import { ActionTypes, ModalActions } from '~/containers/UIKit/interfaces';
import { LISTENER } from '~/containers/Toast';
import I18n from '~/i18n';
import { triggerAction } from '~/lib/methods/actions';
import EventEmitter from '~/lib/methods/helpers/events';
import log from '~/lib/methods/helpers/log';

interface ITriggerAppActionButton {
	button: IAppActionButton;
	rid?: string;
	tmid?: string;
	mid?: string;
	message?: string;
}

export const triggerAppActionButton = async ({ button, rid, tmid, mid, message }: ITriggerAppActionButton): Promise<void> => {
	try {
		const result = await triggerAction({
			type: ActionTypes.ACTION_BUTTON,
			actionId: button.actionId,
			appId: button.appId,
			rid,
			tmid,
			mid,
			payload: { context: button.context, ...(message !== undefined ? { message } : {}) }
		});

		if (result === ModalActions.UNSUPPORTED) {
			EventEmitter.emit(LISTENER, { message: I18n.t('App_action_unsupported') });
		}
	} catch (e) {
		log(e);
		EventEmitter.emit(LISTENER, { message: I18n.t('App_action_error') });
	}
};
