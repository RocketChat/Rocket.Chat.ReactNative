import React from 'react';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import { themes } from '../constants/colors';

class Touch extends React.Component {
	setNativeProps(props) {
		this.ref.setNativeProps(props);
	}

	getRef = (ref) => {
		this.ref = ref;
	};

	render() {
		const {
			children, onPress, theme, ...props
		} = this.props;

		return (
			<RectButton
				ref={this.getRef}
				onPress={onPress}
				activeOpacity={1}
				underlayColor={themes[theme].bannerBackground}
				rippleColor={themes[theme].bannerBackground}
				{...props}
			>
				{children}
			</RectButton>
		);
	}
}

Touch.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func,
	theme: PropTypes.string
};

export default Touch;
