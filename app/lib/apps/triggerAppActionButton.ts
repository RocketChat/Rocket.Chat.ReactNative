import { type IAppActionButton } from './definitions';
import { ActionTypes } from '~/containers/UIKit/interfaces';
import I18n from '~/i18n';
import { triggerAction } from './actions';
import { notifyUnsupported } from './triggerActions';
import { showToast } from '~/lib/methods/helpers/showToast';
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
		notifyUnsupported(
			await triggerAction({
				type: ActionTypes.ACTION_BUTTON,
				actionId: button.actionId,
				appId: button.appId,
				rid,
				tmid,
				mid,
				payload: { context: button.context, ...(message !== undefined ? { message } : {}) }
			})
		);
	} catch (e) {
		log(e);
		showToast(I18n.t('App_action_error'));
	}
};
