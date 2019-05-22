import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { COLOR_TOAST, COLOR_WHITE } from '../constants/colors';
import { isNotch } from './deviceInfo';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	toast: {
		backgroundColor: COLOR_TOAST
	},
	text: {
		...sharedStyles.textRegular,
		color: COLOR_WHITE,
		fontSize: 14
	}
});

const positionValue = isNotch ? 230 : 200;

export const Toast = React.forwardRef((props, ref) => (
	<EasyToast
		{...props}
		ref={ref}
		positionValue={positionValue}
		style={styles.toast}
		textStyle={styles.text}
		opacity={0.8}
	/>
));
export const showErrorAlert = (message: string, title: string) => Alert.alert(title, message, [{ text: 'OK', onPress: () => {} }], { cancelable: true });
