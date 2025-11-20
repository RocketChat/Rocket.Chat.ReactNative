import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import EasyToast from 'react-native-easy-toast';

import { useUserPreferences } from '../lib/methods/userPreferences';
import { type TAlertDisplayType } from '../views/AccessibilityAndAppearanceView';
import EventEmitter from '../lib/methods/helpers/events';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { ALERT_DISPLAY_TYPE_PREFERENCES_KEY } from '../lib/constants/keys';

const styles = StyleSheet.create({
	toast: {
		maxWidth: 300,
		padding: 10
	},
	text: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

export const LISTENER = 'Toast';

let listener: Function;
let toast: EasyToast | null | undefined;

const Toast = (): React.ReactElement => {
	const { colors, theme } = useTheme();
	const [alertDisplayType] = useUserPreferences<TAlertDisplayType>(ALERT_DISPLAY_TYPE_PREFERENCES_KEY, 'TOAST');

	useEffect(() => {
		listener = EventEmitter.addEventListener(LISTENER, showToast);
		return () => {
			EventEmitter.removeListener(LISTENER, listener);
		};
	}, [alertDisplayType]);

	const getToastRef = (newToast: EasyToast | null) => {
		toast = newToast;
	};

	const showToast = ({ message }: { message: string }) => {
		if (alertDisplayType === 'DIALOG') {
			Alert.alert(message);
			return;
		}
		if (toast && toast.show) {
			toast.show(message, process.env.RUNNING_E2E_TESTS === 'true' ? 5000 : 1000);
		}
	};

	return (
		<EasyToast
			ref={getToastRef}
			position='center'
			style={[styles.toast, { backgroundColor: colors.surfaceDark }]}
			textStyle={[styles.text, { color: theme === 'light' ? colors.fontWhite : colors.fontPureBlack }]}
			opacity={0.9}
		/>
	);
};

export default Toast;
