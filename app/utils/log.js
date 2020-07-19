import { Client } from 'bugsnag-react-native';
import firebase from 'react-native-firebase';
import { isGooglePlayBuild } from '../constants/environment';
import config from '../../config';

const bugsnag = new Client(config.BUGSNAG_API_KEY);

export const analytics = isGooglePlayBuild ? firebase.analytics : ({
	logEvent: () => { }
});

export const loggerConfig = bugsnag.config;
export const { leaveBreadcrumb } = bugsnag;

let metadata = {};

export const logServerVersion = (serverVersion) => {
	metadata = {
		serverVersion
	};
};

export const setCurrentScreen = (currentScreen) => {
	if (isGooglePlayBuild) {
		analytics().setCurrentScreen(currentScreen);
	}
	leaveBreadcrumb(currentScreen, { type: 'navigation' });
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
	} else {
		console.log(e);
	}
};
