import { Alert } from 'react-native';
import type EasyToast from 'react-native-easy-toast';

import userPreferences from '~/lib/methods/userPreferences';
import EventEmitter from '~/lib/methods/helpers/events';
import { ALERT_DISPLAY_TYPE_PREFERENCES_KEY } from '~/lib/constants/keys';

export const LISTENER = 'Toast';

const TOAST_DURATION = process.env.RUNNING_E2E_TESTS === 'true' ? 5000 : 1000;

let mountedHosts: EasyToast[] = [];

const showOnTopHost = ({ message }: { message: string }) => {
	if (userPreferences.getString(ALERT_DISPLAY_TYPE_PREFERENCES_KEY) === 'DIALOG') {
		Alert.alert(message);
		return;
	}
	mountedHosts.at(-1)?.show(message, TOAST_DURATION);
};

export const registerToastHost = (host: EasyToast): (() => void) => {
	if (mountedHosts.length === 0) {
		EventEmitter.addEventListener(LISTENER, showOnTopHost);
	}
	mountedHosts.push(host);
	return () => {
		mountedHosts = mountedHosts.filter(mountedHost => mountedHost !== host);
		if (mountedHosts.length === 0) {
			EventEmitter.removeListener(LISTENER, showOnTopHost);
		}
	};
};
