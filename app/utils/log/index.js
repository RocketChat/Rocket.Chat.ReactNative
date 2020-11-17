import firebaseAnalytics from '@react-native-firebase/analytics';
import { isFDroidBuild } from '../../constants/environment';
import config from '../../../config';
import events from './events';

const analytics = firebaseAnalytics || '';
let bugsnag = '';
let crashlytics;
let sentry;

if (!isFDroidBuild) {
	const { Client } = require('bugsnag-react-native');
	crashlytics = require('@react-native-firebase/crashlytics').default;
	bugsnag = new Client(config.BUGSNAG_API_KEY);

	sentry = require('@sentry/react-native');
	sentry.init({ dsn: config.SENTRY_API_KEY });
}

export { analytics };
export const loggerConfig = bugsnag.config;
export const { leaveBreadcrumb } = bugsnag;
export { events };

// https://docs.sentry.io/platforms/react-native/enriching-events/context/
let extra = {};

export const logServerVersion = (serverVersion) => {
	extra = {
		serverVersion
	};
};

export const logEvent = (eventName, payload) => {
	try {
		if (!isFDroidBuild) {
			analytics().logEvent(eventName, payload);
			leaveBreadcrumb(eventName, payload);
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
		leaveBreadcrumb(currentScreen, { type: 'navigation' });
		sentry.addBreadcrumb({
			category: 'navigation',
			message: currentScreen
		});
	}
};

export default (e) => {
	if (e.message !== 'Aborted') {
		sentry.captureException(e, { extra });
		if (!isFDroidBuild && e instanceof Error) {
			crashlytics().recordError(e);
		}
	} else {
		console.log(e);
	}
};
