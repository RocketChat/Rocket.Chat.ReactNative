import { Alert } from 'react-native';
import type EasyToast from 'react-native-easy-toast';

import userPreferences from '~/lib/methods/userPreferences';
import EventEmitter from '~/lib/methods/helpers/events';
import { ALERT_DISPLAY_TYPE_PREFERENCES_KEY } from '~/lib/constants/keys';

export const LISTENER = 'Toast';

const TOAST_DURATION = process.env.RUNNING_E2E_TESTS === 'true' ? 5000 : 1000;

const mountedHosts: EasyToast[] = [];

export const registerToastHost = (host: EasyToast | null): (() => void) | undefined => {
	if (!host) {
		return;
	}
	mountedHosts.push(host);
	return () => {
		const index = mountedHosts.indexOf(host);
		if (index > -1) {
			mountedHosts.splice(index, 1);
		}
	};
};

const showOnTopHost = ({ message }: { message: string }) => {
	if (userPreferences.getString(ALERT_DISPLAY_TYPE_PREFERENCES_KEY) === 'DIALOG') {
		Alert.alert(message);
		return;
	}
	mountedHosts.at(-1)?.show(message, TOAST_DURATION);
};

EventEmitter.addEventListener(LISTENER, showOnTopHost);
