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
		onError() {
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
	console.log('🚀 ~ file: index.js ~ line 56 ~ toggleBugsnagReport ~ value', value);
	try {
		value.toString();
		return reportErrorToBugsnag = value;
	} catch (e) {
		console.log(e);
	}
};

export const toggleAnalyticsReport = (value) => {
	console.log('🚀 ~ file: index.js ~ line 65 ~ toggleAnalyticsReport ~ value', value);
	try {
		value.toString();
		analytics().setAnalyticsCollectionEnabled(value);
		return reportToAnalytics = value;
	} catch (e) {
		console.log(e);
	}
};

export default (e) => {
	// LEMBRAR DE TROCAR A CONDITION e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__
	if (e instanceof Error && bugsnag && e.message !== 'Aborted') {
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
