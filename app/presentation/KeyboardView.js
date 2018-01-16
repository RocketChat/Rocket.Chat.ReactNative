import React from 'react';
import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { connect } from 'react-redux';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { setKeyboardOpen, setKeyboardClosed } from '../actions/keyboard';

@connect(null, dispatch => ({
	setKeyboardOpen: () => dispatch(setKeyboardOpen()),
	setKeyboardClosed: () => dispatch(setKeyboardClosed())
}))
export default class KeyboardView extends React.PureComponent {
	static propTypes = {
		style: ViewPropTypes.style,
		contentContainerStyle: ViewPropTypes.style,
		keyboardVerticalOffset: PropTypes.number,
		scrollEnabled: PropTypes.bool,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]),
		setKeyboardOpen: PropTypes.func,
		setKeyboardClosed: PropTypes.func
	}

	render() {
		return (
			<KeyboardAwareScrollView
				{...scrollPersistTaps}
				style={this.props.style}
				contentContainerStyle={this.props.contentContainerStyle}
				scrollEnabled={this.props.scrollEnabled}
				alwaysBounceVertical={false}
				extraHeight={this.props.keyboardVerticalOffset}
				behavior='position'
				onKeyboardWillShow={() => this.props.setKeyboardOpen()}
				onKeyboardWillHide={() => this.props.setKeyboardClosed()}
			>
				{this.props.children}
			</KeyboardAwareScrollView>
		);
	}
}
