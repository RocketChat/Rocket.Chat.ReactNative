import React, { Component } from 'react';
import { KeyboardAvoidingView, NativeModules, StatusBarIOS } from 'react-native';
import PropTypes from 'prop-types';

const { StatusBarManager } = NativeModules;

const defaultKeyboardVerticalOffset = 44;

export default class IOSKeyboardAvoidingView extends Component {
	static propTypes = {
		style: PropTypes.object,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]).isRequired
	};

	state = { statusBarHeight: 0 };

	componentDidMount() {
		StatusBarManager.getHeight((statusBarFrameData) => {
			this.setState({ statusBarHeight: statusBarFrameData.height });
		});
		this.statusBarListener = StatusBarIOS.addListener('statusBarFrameWillChange', (statusBarData) => {
			this.setState({ statusBarHeight: statusBarData.frame.height });
		});
	}

	componentWillUnmount() {
		this.statusBarListener.remove();
	}

	render() {
		const { style, children } = this.props;
		const { statusBarHeight } = this.state;

		return (
			<KeyboardAvoidingView
				behavior='padding'
				keyboardVerticalOffset={defaultKeyboardVerticalOffset + statusBarHeight}
				style={style}
			>{children}
			</KeyboardAvoidingView>
		);
	}
}
