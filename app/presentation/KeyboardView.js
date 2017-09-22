import React from 'react';
import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default class KeyboardView extends React.PureComponent {
	static propTypes = {
		style: ViewPropTypes.style,
		keyboardVerticalOffset: PropTypes.number,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		])
	}

	render() {
		return (
			<KeyboardAwareScrollView
				contentContainerStyle={this.props.style}
				behavior='position'
				extraHeight={this.props.keyboardVerticalOffset}
				keyboardDismissMode='interactive'
				keyboardShouldPersistTaps='always'
			>
				{this.props.children}
			</KeyboardAwareScrollView>
		);
	}
}
