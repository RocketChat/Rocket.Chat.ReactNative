import React, { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { useUserPreferences } from '../lib/methods';
import { TAlertDisplayType } from '../views/AccessibilityAndAppearanceView';
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
		if (toast && toast.show) {
			switch (alertDisplayType) {
				case 'DIALOG':
					Alert.alert(message);
					break;
				case 'TOAST':
					toast.show(message, 1000);
					break;
			}
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
