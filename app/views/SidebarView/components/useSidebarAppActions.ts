import { DrawerActions } from '@react-navigation/native';

import { triggerAppActionButton } from '~/lib/apps/actions';
import { UIActionButtonContext } from '~/lib/apps/definitions';
import { useAppActionButtons } from '~/lib/apps/useAppActionButtons';
import { events, logEvent } from '~/lib/methods/helpers/log';
import Navigation from '~/lib/navigation/appNavigation';

export interface ISidebarAppAction {
	id: string;
	title: string;
	testID: string;
	onPress: () => void;
}

export const useSidebarAppActions = (): ISidebarAppAction[] =>
	useAppActionButtons()
		.filter(({ button }) => button.context === UIActionButtonContext.USER_DROPDOWN_ACTION)
		.map(({ id, label, button }) => ({
			id,
			title: label,
			testID: `sidebar-app-${id}`,
			onPress: () => {
				logEvent(events.SIDEBAR_APP_ACTION, { appId: button.appId, actionId: button.actionId });
				Navigation.dispatch(DrawerActions.closeDrawer());
				triggerAppActionButton({ button });
			}
		}));
