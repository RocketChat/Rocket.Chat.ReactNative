import { getAnalytics } from '@react-native-firebase/analytics';
import { getCrashlytics } from '@react-native-firebase/crashlytics';
import { isFDroidBuild } from '../../../constants/environment';
import events from './events';

import type { default as Bugsnag } from '@bugsnag/expo';

const analytics = getAnalytics();
let bugsnag:  typeof Bugsnag | null = null;
const crashlytics = getCrashlytics();
let reportCrashErrors = true;
let reportAnalyticsEvents = true;

export const getReportCrashErrorsValue = (): boolean => reportCrashErrors;
export const getReportAnalyticsEventsValue = (): boolean => reportAnalyticsEvents;

if (!isFDroidBuild) {
	bugsnag = require('@bugsnag/expo').default;
	bugsnag?.start({
		onBreadcrumb() {
			return reportAnalyticsEvents;
		},
		onError(error) {
			if (!reportAnalyticsEvents) {
				error.breadcrumbs = [];
			}
			return reportCrashErrors;
		}
	});
}

// export { analytics };
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
			analytics.logEvent(eventName, payload);
			bugsnag?.leaveBreadcrumb(eventName, payload);
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen: string): void => {
	if (!isFDroidBuild) {
		analytics.logScreenView({ screen_class: currentScreen, screen_name: currentScreen });
		bugsnag?.leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};

export const toggleCrashErrorsReport = (value: boolean): boolean => {
	crashlytics.setCrashlyticsCollectionEnabled(value);
	return (reportCrashErrors = value);
};

export const toggleAnalyticsEventsReport = (value: boolean): boolean => {
	analytics.setAnalyticsCollectionEnabled(value);
	return (reportAnalyticsEvents = value);
};

export default function log(e: unknown): void {
	if (e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__) {
		bugsnag.notify(e, (event) => {
			event.addMetadata('details', { ...metadata });
		});
		if (!isFDroidBuild) {
			crashlytics.recordError(e);
		}
	} else {
		console.error(e);
	}
};
