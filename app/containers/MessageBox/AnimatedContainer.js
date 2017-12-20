import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';

export default class MessageBox extends React.PureComponent {
	static propTypes = {
		subview: PropTypes.object.isRequired,
		visible: PropTypes.bool.isRequired,
		messageboxHeight: PropTypes.number.isRequired
	}

	constructor(props) {
		super(props);
		this.animatedBottom = new Animated.Value(0);
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.visible === nextProps.visible) {
			return;
		}
		if (nextProps.visible) {
			return this.show();
		}
		this.hide();
	}

	show() {
		this.animatedBottom.setValue(0);
		Animated.timing(this.animatedBottom, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true
		}).start();
	}

	hide() {
		Animated.timing(this.animatedBottom, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true
		}).start();
	}

	render() {
		const bottom = this.animatedBottom.interpolate({
			inputRange: [0, 1],
			outputRange: [0, -this.props.messageboxHeight - 200]
		});

		return (
			<Animated.View
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: -200,
					zIndex: 1,
					transform: [{ translateY: bottom }]
				}}
			>
				{this.props.subview}
			</Animated.View>
		);
	}
}
