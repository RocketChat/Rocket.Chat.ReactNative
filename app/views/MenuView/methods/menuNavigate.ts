import Navigation from '~/lib/navigation/appNavigation';
import { events, logEvent } from '~/lib/methods/helpers/log';

export const menuNavigate = (route: string) => {
	// @ts-ignore
	logEvent(events[`SIDEBAR_GO_${route.replace('View', '').toUpperCase()}`]);
	Navigation.navigate(route);
};
