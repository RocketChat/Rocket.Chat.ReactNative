import { Platform } from 'react-native';
import * as AddCalendarEvent from 'react-native-add-calendar-event';
import * as Permissions from 'react-native-permissions';
import { addHours, parseISO } from 'date-fns';

interface IEventConfig {
	title: string;
	startDate: string; //  'YYYY-MM-DDTHH:mm:ss.SSSZ'
	endDate: string;
	location: string;
	allDay: boolean;
	url?: string; // iOS only
	notes: string; // The notes (iOS) or description (Android) associated with the event.
	navigationBarIOS?: {
		tintColor: string;
		barTintColor: string;
		backgroundColor: string;
		translucent: boolean;
		titleColor: string;
	};
}

const addToPersonalCalendar = event =>
	Permissions.request(
		Platform.select({
			ios: Permissions.PERMISSIONS.IOS.CALENDARS_WRITE_ONLY,
			android: Permissions.PERMISSIONS.ANDROID.WRITE_CALENDAR
		})
	)
		.then(result => {
			if (result !== Permissions.RESULTS.GRANTED) {
				return;
			}
			const eventStartDate = parseISO(event.dateTime);
			const eventEndDate = addHours(eventStartDate, 1);

			const eventConfig: IEventConfig = {
				title: event.title,
				startDate: new Date(eventStartDate).toISOString(),
				endDate: new Date(eventEndDate).toISOString(),
				location: event.meetingLink,
				allDay: false,
				notes: event.description
			};
			return AddCalendarEvent.presentEventCreatingDialog(eventConfig);
		})
		.then((eventInfo: { calendarItemIdentifier: string; eventIdentifier: string }) => {
			// handle success - receives an object with `calendarItemIdentifier` and `eventIdentifier` keys, both of type string.
			// These are two different identifiers on iOS.
			// On Android, where they are both equal and represent the event id, also strings.
			// when { action: 'CANCELED' } is returned, the dialog was dismissed
			console.warn(JSON.stringify(eventInfo));
		})
		.catch((error: string) => {
			// handle error such as when user rejected permissions
			console.warn(error);
		});

export default addToPersonalCalendar;
