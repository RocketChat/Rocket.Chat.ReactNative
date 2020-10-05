import firebaseAnalytics from '@react-native-firebase/analytics';
import { isFDroidBuild } from '../../constants/environment';
import config from '../../../config';
import events from './events';

const analytics = firebaseAnalytics || '';
let bugsnag = '';
let crashlytics;

if (!isFDroidBuild) {
	const { Client } = require('bugsnag-react-native');
	crashlytics = require('@react-native-firebase/crashlytics').default;
	bugsnag = new Client(config.BUGSNAG_API_KEY);
}

export { analytics };
export const loggerConfig = bugsnag.config;
export const { leaveBreadcrumb } = bugsnag;
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
			leaveBreadcrumb(eventName, payload);
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen) => {
	if (!isFDroidBuild) {
		analytics().setCurrentScreen(currentScreen);
		leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};

export default (e) => {
	if (e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__) {
		bugsnag.notify(e, (report) => {
			report.metadata = {
				details: {
					...metadata
				}
			};
		});
		if (!isFDroidBuild) {
			crashlytics().recordError(e);
		}
	} else {
		console.log(e);
	}
};
