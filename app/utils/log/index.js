import firebaseAnalytics from '@react-native-firebase/analytics';
import { isFDroidBuild } from '../../constants/environment';
import events from './events';

const analytics = firebaseAnalytics || '';
let bugsnag = '';
let crashlytics;
let reportErrorToBugsnag = true;
let reportToAnalytics = true;

export const getReportErrorToBugsnag = () => reportErrorToBugsnag;
export const getReportToAnalytics = () => reportToAnalytics;


if (!isFDroidBuild) {
	bugsnag = require('@bugsnag/react-native').default;
	bugsnag.start({
		onBreadcrumb() {
			return reportToAnalytics;
		},
		onError(error) {
			if (!reportToAnalytics) { error.breadcrumbs = []; }
			return reportErrorToBugsnag;
		}
	});
	crashlytics = require('@react-native-firebase/crashlytics').default;
}

export { analytics };
export const loggerConfig = bugsnag.config;
export { events };

let metadata = {};

export const logServerVersion = (serverVersion) => {
	metadata = {
		serverVersion
	};
};

export const logEvent = (eventName, payload) => {
	try {
		if (!isFDroidBuild) {
			analytics().logEvent(eventName, payload);
			bugsnag.leaveBreadcrumb(eventName, payload);
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen) => {
	if (!isFDroidBuild) {
		analytics().setCurrentScreen(currentScreen);
		bugsnag.leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};

export const toggleBugsnagReport = (value) => {
	crashlytics().setCrashlyticsCollectionEnabled(value);
	return reportErrorToBugsnag = value;
};

export const toggleAnalyticsReport = (value) => {
	analytics().setAnalyticsCollectionEnabled(value);
	return reportToAnalytics = value;
};

export default (e) => {
	if (e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__) {
		bugsnag.notify(e, (event) => {
			event.addMetadata('details', { ...metadata });
		});
		if (!isFDroidBuild) {
			crashlytics().recordError(e);
		}
	} else {
		console.log(e);
	}
};
