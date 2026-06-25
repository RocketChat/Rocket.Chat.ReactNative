import Navigation from '../../../lib/navigation/appNavigation';
import { events, logEvent } from '../../../lib/methods/helpers/log';

export const sidebarNavigate = (route: string) => {
	// @ts-ignore
	logEvent(events[`SIDEBAR_GO_${route.replace('StackNavigator', '').replace('View', '').toUpperCase()}`]);
	Navigation.navigate(route);
};
