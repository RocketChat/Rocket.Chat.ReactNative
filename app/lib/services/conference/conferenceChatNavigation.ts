import Navigation from '~/lib/navigation/appNavigation';
import { CONFERENCE_ROUTE } from './conferenceCallNavigation';

const openOutsideTheCall = (open: () => void): void => {
	if (Navigation.getCurrentRoute()?.name === CONFERENCE_ROUTE) {
		Navigation.navigate('ChatsStackNavigator');
	}
	open();
};

export const createConferenceChatNavigation = () => ({
	navigate: (name: string, params?: object) => openOutsideTheCall(() => Navigation.navigate(name, params)),
	push: (name: string, params?: object) => openOutsideTheCall(() => Navigation.push(name, params)),
	goBack: () => undefined,
	canGoBack: () => false,
	setOptions: () => undefined,
	setParams: () => undefined,
	addListener: () => () => undefined,
	isFocused: () => true,
	getParent: () => undefined
});
