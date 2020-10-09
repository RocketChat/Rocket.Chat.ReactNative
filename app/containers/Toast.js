import React from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
	toast: {
		maxWidth: 300,
		padding: 10
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 14,
		textAlign: 'center'
	}
});

const getToastRef = toast => this.toast = toast;

export const showToast = ({ message }) => {
	if (this.toast && this.toast.show) {
		this.toast.show(message, 1000);
	}
}

class Toast extends React.Component {
	static propTypes = {
		theme: PropTypes.string
	}

	shouldComponentUpdate(nextProps) {
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	render() {
		const { theme } = this.props;
		return (
			<EasyToast
				ref={getToastRef}
				position='center'
				style={[styles.toast, { backgroundColor: themes[theme].toastBackground }]}
				textStyle={[styles.text, { color: themes[theme].buttonText }]}
				opacity={0.9}
			/>
		);
	}
}

export default withTheme(Toast);
