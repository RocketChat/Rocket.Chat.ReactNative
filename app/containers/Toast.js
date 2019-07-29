import React from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { COLOR_TOAST, COLOR_WHITE } from '../constants/colors';
import sharedStyles from '../views/Styles';
import EventEmitter from '../utils/events';

const styles = StyleSheet.create({
	toast: {
		backgroundColor: COLOR_TOAST,
		maxWidth: 300,
		padding: 10
	},
	text: {
		...sharedStyles.textRegular,
		color: COLOR_WHITE,
		fontSize: 14,
		textAlign: 'center'
	}
});

export const LISTENER = 'Toast';

export default class Toast extends React.Component {
	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.showToast);
	}

	shouldComponentUpdate() {
		return false;
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	showToast = ({ message }) => {
		this.toast.show(message, 1000);
	}

	render() {
		return (
			<EasyToast
				ref={toast => this.toast = toast}
				position='center'
				style={styles.toast}
				textStyle={styles.text}
				opacity={0.9}
			/>
		);
	}
}
