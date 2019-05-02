import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { COLOR_TITLE } from '../constants/colors';

const styles = StyleSheet.create({
	toast: {
		backgroundColor: COLOR_TITLE
	}
});

export const Toast = React.forwardRef((props, ref) => (
	<EasyToast
		{...props}
		ref={ref}
		positionValue={200}
		style={styles.toast}
	/>
));
export const showErrorAlert = (message: string, title: string) => Alert.alert(title, message, [{ text: 'OK', onPress: () => {} }], { cancelable: true });
