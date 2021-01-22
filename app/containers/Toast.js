import React, { useRef, useContext, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
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

const context = React.createContext({
	showToast: () => {}
});

const { Provider } = context;

export const useToast = () => useContext(context);

export const ToastProvider = React.memo(({ children }) => {
	const ref = useRef();
	const { theme } = useTheme();

	const getContext = () => ({
		showToast: ({ message }) => {
			ref.current?.show(message, 1000);
		}
	});

	return (
		<Provider value={getContext()}>
			{children}
			<EasyToast
				ref={ref}
				position='center'
				style={[styles.toast, { backgroundColor: themes[theme].toastBackground }]}
				textStyle={[styles.text, { color: themes[theme].buttonText }]}
				opacity={0.9}
			/>
		</Provider>
	);
});

ToastProvider.propTypes = {
	children: PropTypes.node
};
