import Navigation from '~/lib/navigation/appNavigation';
import { useConferenceCallStore } from './useConferenceCallStore';

export const CONFERENCE_ROUTE = 'ConferenceView';

let openGeneration = 0;

export const currentConferenceCallOpen = (): number => openGeneration;

export const beginConferenceCallOpen = (): number => {
	openGeneration += 1;
	return openGeneration;
};

const invalidatePendingConferenceCallOpen = (): void => {
	openGeneration += 1;
};

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
	invalidatePendingConferenceCallOpen();
	useConferenceCallStore.getState().close();
	if (isShowingConference()) {
		Navigation.back();
	}
};
