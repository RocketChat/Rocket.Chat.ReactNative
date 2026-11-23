import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type EasyToast from 'react-native-easy-toast';

import { useUserPreferences } from '~/lib/methods/userPreferences';
import { type TAlertDisplayType } from '~/views/AccessibilityAndAppearanceView';
import EventEmitter from '~/lib/methods/helpers/events';
import { ALERT_DISPLAY_TYPE_PREFERENCES_KEY } from '~/lib/constants/keys';
import { isTopToastHost, registerToastHost } from './toastHosts';
import { LISTENER } from './listener';

const TOAST_DURATION = process.env.RUNNING_E2E_TESTS === 'true' ? 5000 : 1000;

export const useToastHost = (): ((host: EasyToast | null) => void) => {
	const [alertDisplayType] = useUserPreferences<TAlertDisplayType>(ALERT_DISPLAY_TYPE_PREFERENCES_KEY, 'TOAST');
	const [host, setHost] = useState<EasyToast | null>(null);

	useEffect(() => {
		if (!host) {
			return;
		}
		return registerToastHost(host);
	}, [host]);

	useEffect(() => {
		if (!host) {
			return;
		}
		const showOnTopHost = ({ message }: { message: string }) => {
			if (!isTopToastHost(host)) {
				return;
			}
			if (alertDisplayType === 'DIALOG') {
				Alert.alert(message);
				return;
			}
			host.show(message, TOAST_DURATION);
		};
		EventEmitter.addEventListener(LISTENER, showOnTopHost);
		return () => EventEmitter.removeListener(LISTENER, showOnTopHost);
	}, [host, alertDisplayType]);

	return setHost;
};
