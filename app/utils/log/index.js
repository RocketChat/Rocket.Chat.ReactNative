import firebaseAnalytics from '@react-native-firebase/analytics';
import { isFDroidBuild } from '../../constants/environment';
import config from '../../../config';
import events from './events';

const analytics = firebaseAnalytics || '';
let crashlytics;
let sentry;

if (!isFDroidBuild) {
	crashlytics = require('@react-native-firebase/crashlytics').default;

	sentry = require('@sentry/react-native');
	sentry.init({ dsn: config.SENTRY_API_KEY });
}

export { analytics, events };

export const setCrashReportEnabled = (enabled) => {
	sentry.init({ dsn: enabled ? config.SENTRY_API_KEY : '' });
	crashlytics().setCrashlyticsCollectionEnabled(enabled);
};

export const setAnalyticsEnabled = (enabled) => {
	analytics().setAnalyticsCollectionEnabled(enabled);
};

export const logServerVersion = (serverVersion) => {
	sentry.setContext('extra', {
		serverVersion
	});
};

export const logEvent = (eventName, payload) => {
	try {
		if (!isFDroidBuild) {
			analytics().logEvent(eventName, payload);
			sentry.addBreadcrumb({
				category: 'manual',
				message: eventName,
				data: payload
			});
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen) => {
	if (!isFDroidBuild) {
		analytics().setCurrentScreen(currentScreen);
		sentry.addBreadcrumb({
			category: 'navigation',
			message: currentScreen
		});
	}
};

export default (e) => {
	if (e.message !== 'Aborted') {
		sentry.captureException(e);
		if (!isFDroidBuild && e instanceof Error) {
			crashlytics().recordError(e);
		}
	} else {
		console.log(e);
	}
};
