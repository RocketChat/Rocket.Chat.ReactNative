import { Client } from 'bugsnag-react-native';
import firebase from 'react-native-firebase';
import config from '../../config';

const bugsnag = new Client(config.BUGSNAG_API_KEY);

export const { analytics } = firebase;
export const loggerConfig = bugsnag.config;
export const { leaveBreadcrumb } = bugsnag;

export default (e) => {
	if (e instanceof Error && !__DEV__) {
		bugsnag.notify(e);
	} else {
		console.log(e);
	}
};
