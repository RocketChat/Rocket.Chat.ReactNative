import Navigation from '../../navigation/appNavigation';
import { useConferenceCallStore } from './useConferenceCallStore';

export const CONFERENCE_ROUTE = 'ConferenceView';

const isShowingConference = () => Navigation.getCurrentRoute()?.name === CONFERENCE_ROUTE;

export const expandConferenceCall = (): void => {
	useConferenceCallStore.getState().expand();
	if (!isShowingConference()) {
		Navigation.navigate(CONFERENCE_ROUTE);
	}
};

// Popping the route is what minimizes the call: ConferenceView reports it on blur.
export const minimizeConferenceCall = (): void => {
	if (isShowingConference()) {
		Navigation.back();
		return;
	}
	useConferenceCallStore.getState().minimize();
};

export const closeConferenceCall = (): void => {
	useConferenceCallStore.getState().close();
	if (isShowingConference()) {
		Navigation.back();
	}
};
