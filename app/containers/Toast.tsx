import React from 'react';
import { StyleSheet } from 'react-native';
import EasyToast from 'react-native-easy-toast';

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

interface IToastProps {
	theme?: string;
}

class Toast extends React.Component<IToastProps, any> {
	private listener: any;

	private toast: any;

	componentDidMount() {
		this.listener = EventEmitter.addEventListener(LISTENER, this.showToast);
	}

	shouldComponentUpdate(nextProps: any) {
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER, this.listener);
	}

	getToastRef = (toast: any) => (this.toast = toast);

	showToast = ({ message }: any) => {
		if (this.toast && this.toast.show) {
			this.toast.show(message, 1000);
		}
	};

	render() {
		const { theme } = this.props;
		return (
			<EasyToast
				ref={this.getToastRef}
				// @ts-ignore
				position='center'
				style={[styles.toast, { backgroundColor: themes[theme!].toastBackground }]}
				textStyle={[styles.text, { color: themes[theme!].buttonText }]}
				opacity={0.9}
			/>
		);
	}
}

export default withTheme(Toast);
