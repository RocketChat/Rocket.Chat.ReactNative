import React from 'react';
import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default class KeyboardView extends React.PureComponent {
	static propTypes = {
		style: ViewPropTypes.style,
		contentContainerStyle: ViewPropTypes.style,
		keyboardVerticalOffset: PropTypes.number,
		scrollEnabled: PropTypes.bool,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		])
	}

	render() {
		return (
			<KeyboardAwareScrollView
				keyboardDismissMode='interactive'
				keyboardShouldPersistTaps='always'
				style={this.props.style}
				contentContainerStyle={this.props.contentContainerStyle}
				scrollEnabled={this.props.scrollEnabled}
				alwaysBounceVertical={false}
				extraHeight={this.props.keyboardVerticalOffset}
				behavior='position'
			>
				{this.props.children}
			</KeyboardAwareScrollView>
		);
	}
}
