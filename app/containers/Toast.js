import React from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import EventEmitter from '../utils/events';
import { withTheme } from '../theme';

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

class Toast extends React.Component {
	static propTypes = {
		theme: PropTypes.string
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.showToast);
	}

	shouldComponentUpdate(nextProps) {
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	getToastRef = toast => this.toast = toast;

	showToast = ({ message }) => {
		if (this.toast && this.toast.show) {
			this.toast.show(message, 1000);
		}
	}

	render() {
		const { theme } = this.props;
		return (
			<EasyToast
				ref={this.getToastRef}
				position='center'
				style={[styles.toast, { backgroundColor: themes[theme].toastBackground }]}
				textStyle={[styles.text, { color: themes[theme].buttonText }]}
				opacity={0.9}
			/>
		);
	}
}

export default withTheme(Toast);
