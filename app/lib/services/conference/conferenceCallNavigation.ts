import Navigation from '../../navigation/appNavigation';
import { useConferenceCallStore } from './useConferenceCallStore';

export const CONFERENCE_ROUTE = 'ConferenceView';

const isShowingConference = () => Navigation.getCurrentRoute()?.name === CONFERENCE_ROUTE;

export const expandConferenceCall = (): void => {
	if (!useConferenceCallStore.getState().callId) {
		return;
	}
	useConferenceCallStore.getState().expand();
	if (!isShowingConference()) {
		Navigation.navigate(CONFERENCE_ROUTE);
	}
};

export const closeConferenceCall = (): void => {
	useConferenceCallStore.getState().close();
	if (isShowingConference()) {
		Navigation.back();
	}
};
