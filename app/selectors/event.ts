import { createSelector } from 'reselect';

import { IApplicationState } from '../definitions';

const getEvent = (state: IApplicationState) => state.calendarEvents.draftEvent;

export const getDraftEventSelector = createSelector([getEvent], event => event);

const getPopup = (state: IApplicationState) => state.confirmationPopup;
export const getPopupSelector = createSelector([getPopup], confirmationPopup => confirmationPopup);

const getCalendarEvents = (state: IApplicationState) => state.calendarEvents;

export const getCalendarEventsSelector = createSelector([getCalendarEvents], calendarEvents => calendarEvents);

export const getFetchedEventsSelector = createSelector([getCalendarEvents], calendarEvents =>
	calendarEvents.fetchedEvents.length ? calendarEvents.fetchedEvents : []
);

const getPressedEvent = (state: IApplicationState) => state.calendarEvents.pressedEvent;

export const getPressedEventSelector = createSelector([getPressedEvent], event => event);
