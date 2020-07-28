import { Client } from 'bugsnag-react-native';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { isFDroidBuild } from '../../constants/environment';
import config from '../../../config';
import events from './events';

const bugsnag = new Client(config.BUGSNAG_API_KEY);

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
	if (!isFDroidBuild) {
		analytics().logEvent(eventName, payload);
		leaveBreadcrumb(eventName, payload);
	}
};

export const setCurrentScreen = (currentScreen) => {
	if (!isFDroidBuild) {
		analytics().setCurrentScreen(currentScreen);
		leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};

export default (e) => {
	if (e instanceof Error && e.message !== 'Aborted' && !__DEV__) {
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
