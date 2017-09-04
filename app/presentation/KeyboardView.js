import React from 'react';
import PropTypes from 'prop-types';
import { KeyboardAvoidingView, Platform } from 'react-native';

export default class KeyboardView extends React.PureComponent {
	static propTypes = {
		style: KeyboardAvoidingView.propTypes.style,
		keyboardVerticalOffset: PropTypes.number,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		])
	}

	render() {
		return (
			<KeyboardAvoidingView style={this.props.style} behavior={Platform.OS === 'ios' ? 'padding' : null} keyboardVerticalOffset={this.props.keyboardVerticalOffset}>
				{this.props.children}
			</KeyboardAvoidingView>
		);
	}
}
