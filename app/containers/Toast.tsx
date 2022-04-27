import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { themes } from '../lib/constants';
import sharedStyles from '../views/Styles';
import EventEmitter from '../utils/events';
import { TSupportedThemes, withTheme } from '../theme';

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

interface IToastProps {
	theme?: TSupportedThemes;
}

const Toast = ({ theme }: IToastProps) => {
	let listner: Function;
	let toast: EasyToast | null | undefined;
	useEffect(() => {
		listner = EventEmitter.addEventListener(LISTENER, showToast);
		return () => {
			EventEmitter.removeListener(LISTENER, listner);
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
			style={[styles.toast, { backgroundColor: themes[theme!].toastBackground }]}
			textStyle={[styles.text, { color: themes[theme!].buttonText }]}
			opacity={0.9}
		/>
	);
};

export default withTheme(Toast);
