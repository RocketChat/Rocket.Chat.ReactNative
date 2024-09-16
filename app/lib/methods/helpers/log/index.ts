import firebaseAnalytics from '@react-native-firebase/analytics';

import { isFDroidBuild } from '../../../constants/environment';
import events from './events';

const analytics = firebaseAnalytics || '';
let bugsnag: any = '';
let crashlytics: any;
let reportCrashErrors = true;
let reportAnalyticsEvents = true;

export const getReportCrashErrorsValue = (): boolean => reportCrashErrors;
export const getReportAnalyticsEventsValue = (): boolean => reportAnalyticsEvents;

if (!isFDroidBuild) {
	bugsnag = require('@bugsnag/react-native').default;
	bugsnag.start({
		onBreadcrumb() {
			return reportAnalyticsEvents;
		},
		onError(error: { breadcrumbs: string[] }) {
			if (!reportAnalyticsEvents) {
				error.breadcrumbs = [];
			}
			return reportCrashErrors;
		}
	});
	crashlytics = require('@react-native-firebase/crashlytics').default;
}

export { analytics };
export const loggerConfig = bugsnag.config;
export { events };

let metadata = {};

export const logServerVersion = (serverVersion: string): void => {
	metadata = {
		serverVersion
	};
};

export const logEvent = (eventName: string, payload?: { [key: string]: any }): void => {
	try {
		if (!isFDroidBuild) {
			analytics().logEvent(eventName, payload);
			bugsnag.leaveBreadcrumb(eventName, payload);
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen: string): void => {
	if (!isFDroidBuild) {
		analytics().logScreenView({ screen_class: currentScreen, screen_name: currentScreen });
		bugsnag.leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};

export const toggleCrashErrorsReport = (value: boolean): boolean => {
	crashlytics().setCrashlyticsCollectionEnabled(value);
	return (reportCrashErrors = value);
};

export const toggleAnalyticsEventsReport = (value: boolean): boolean => {
	analytics().setAnalyticsCollectionEnabled(value);
	return (reportAnalyticsEvents = value);
};

export default (e: any): void => {
	if (e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__) {
		bugsnag.notify(e, (event: { addMetadata: (arg0: string, arg1: {}) => void }) => {
			event.addMetadata('details', { ...metadata });
		});
		if (!isFDroidBuild) {
			crashlytics().recordError(e);
		}
	} else {
		console.error(e);
	}
};
