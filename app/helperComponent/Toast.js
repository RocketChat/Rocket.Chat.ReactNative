import React from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

import { COLOR_TOAST, COLOR_WHITE } from '../constants/colors';
import { isNotch } from '../utils/deviceInfo';
import sharedStyles from '../views/Styles';
import EventEmitter from '../utils/events';

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

const POSITION_VALUE = isNotch ? 230 : 200;
export const LISTENER = 'Toast';

export default class Toast extends React.Component {
	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.showToast);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	showToast = ({ message }) => {
		this.toast.show(message);
	}

	render() {
		return (
			<EasyToast
				ref={toast => this.toast = toast}
				positionValue={POSITION_VALUE}
				style={styles.toast}
				textStyle={styles.text}
				opacity={0.8}
			/>
		);
	}
}
