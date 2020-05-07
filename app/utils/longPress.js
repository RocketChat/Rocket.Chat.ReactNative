import React from 'react';
import PropTypes from 'prop-types';
import { State, LongPressGestureHandler } from 'react-native-gesture-handler';

class LongPress extends React.Component {
	setNativeProps(props) {
		this.ref.setNativeProps(props);
	}

	getRef = (ref) => {
		this.ref = ref;
	};

	longPress = ({ nativeEvent }) => {
		const { onLongPress } = this.props;
		if (nativeEvent.state === State.ACTIVE) {
			if (onLongPress) {
				onLongPress();
			}
		}
	};

	render() {
		const { children, ...props } = this.props;

		return (
			<LongPressGestureHandler
				onHandlerStateChange={this.longPress}
				minDurationMs={800}
				ref={this.getRef}
				{...props}
			>
				{children}
			</LongPressGestureHandler>
		);
	}
}

LongPress.propTypes = {
	children: PropTypes.node,
	onLongPress: PropTypes.func
};

export default LongPress;
