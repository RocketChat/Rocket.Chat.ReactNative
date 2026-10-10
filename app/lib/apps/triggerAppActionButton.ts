import { triggerAction } from './actions';
import { type IAppActionButton } from './definitions';
import { notifyUnsupported } from './triggerActions';
import { ActionTypes } from '~/containers/UIKit/interfaces';
import I18n from '~/i18n';
import log from '~/lib/methods/helpers/log';
import { showToast } from '~/lib/methods/helpers/showToast';

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
				payload: { context: button.context, message }
			})
		);
	} catch (e) {
		log(e);
		showToast(I18n.t('App_action_error'));
	}
};
