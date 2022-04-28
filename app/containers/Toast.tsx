import React from 'react';
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

class Toast extends React.Component<IToastProps, any> {
	private listener?: Function;

	private toast: EasyToast | null | undefined;

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
		if (this.listener) {
			EventEmitter.removeListener(LISTENER, this.listener);
		}
	}

	getToastRef = (toast: EasyToast | null) => (this.toast = toast);

	showToast = ({ message }: { message: string }) => {
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
