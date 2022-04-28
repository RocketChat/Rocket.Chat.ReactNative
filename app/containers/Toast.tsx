import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import sharedStyles from '../views/Styles';
import EventEmitter from '../utils/events';
import { useTheme } from '../theme';

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

const Toast = () => {
	const { colors } = useTheme();
	let listener: Function;
	let toast: EasyToast | null | undefined;
	useEffect(() => {
		listener = EventEmitter.addEventListener(LISTENER, showToast);
		return () => {
			EventEmitter.removeListener(LISTENER, listener);
		};
	});
	const getToastRef = (newToast: EasyToast | null) => (toast = newToast);

	const showToast = ({ message }: { message: string }) => {
		if (toast && toast.show) {
			toast.show(message, 1000);
		}
	};
	return (
		<EasyToast
			ref={getToastRef}
			// @ts-ignore
			position='center'
			style={[styles.toast, { backgroundColor: colors.toastBackground }]}
			textStyle={[styles.text, { color: colors.buttonText }]}
			opacity={0.9}
		/>
	);
};

export default Toast;
