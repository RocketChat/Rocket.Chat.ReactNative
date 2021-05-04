import React from 'react';
import PropTypes from 'prop-types';

import { Pressable } from 'react-native';
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
			children, onPress, onLongPress, theme, ...props
		} = this.props;

		return (
			<Pressable
				ref={this.getRef}
				onPress={onPress}
				onLongPress={onLongPress}
				activeOpacity={1}
				style={({ pressed }) => [{
					backgroundColor: pressed ? themes[theme].chatComponentBackground : themes[theme].backgroundColor
				}]}
				android_ripple={{ color: themes[theme].bannerBackground }}
				{...props}
			>
				{children}
			</Pressable>
		);
	}
}

Touch.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func,
	onLongPress: PropTypes.func,
	theme: PropTypes.string,
	underlayColor: PropTypes.string
};

export default Touch;
