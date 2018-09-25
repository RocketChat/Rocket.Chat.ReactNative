import PropTypes from 'prop-types';
import React from 'react';
import { Animated, Text } from 'react-native';

export default class Fade extends React.Component {
	static propTypes = {
		visible: PropTypes.bool.isRequired,
		style: Animated.View.propTypes.style,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		])
	}

	constructor(props) {
		super(props);
		const { visible } = this.props;
		this.state = {
			visible
		};
		this._visibility = new Animated.Value(visible ? 1 : 0);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.visible) {
			this.setState({ visible: true });
		}
		Animated.timing(this._visibility, {
			toValue: nextProps.visible ? 1 : 0,
			duration: 300,
			useNativeDriver: true
		}).start(() => {
			this.setState({ visible: nextProps.visible });
		});
	}

	render() {
		const { visible } = this.state;
		const { style, children, ...rest } = this.props;

		const containerStyle = {
			opacity: this._visibility.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 1]
			}),
			transform: [
				{
					scale: this._visibility.interpolate({
						inputRange: [0, 1],
						outputRange: [1.1, 1]
					})
				}
			]
		};

		const combinedStyle = [containerStyle, style];
		return (
			<Animated.View style={visible ? combinedStyle : containerStyle} {...rest}>
				<Text>{visible ? children : null}</Text>
			</Animated.View>
		);
	}
}
