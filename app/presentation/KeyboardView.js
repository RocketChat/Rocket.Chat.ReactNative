import React from 'react';
import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import scrollPersistTaps from '../utils/scrollPersistTaps';

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
		const {
			style, contentContainerStyle, scrollEnabled, keyboardVerticalOffset, children
		} = this.props;

		return (
			<KeyboardAwareScrollView
				{...scrollPersistTaps}
				style={style}
				contentContainerStyle={contentContainerStyle}
				scrollEnabled={scrollEnabled}
				alwaysBounceVertical={false}
				extraHeight={keyboardVerticalOffset}
				behavior='position'
			>
				{children}
			</KeyboardAwareScrollView>
		);
	}
}
