import PropTypes from 'prop-types';
import React from 'react';
import { Animated, Text } from 'react-native';

export default class Fade extends React.Component {
	static propTypes = {
		visible: PropTypes.bool.isRequired,
		style: PropTypes.object,
		children: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.state = {
			visible: props.visible
		};
	}

	componentWillMount() {
		this._visibility = new Animated.Value(this.props.visible ? 1 : 0);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.visible) {
			this.setState({ visible: true });
		}
		Animated.timing(this._visibility, {
			toValue: nextProps.visible ? 1 : 0,
			duration: 300
		}).start(() => {
			this.setState({ visible: nextProps.visible });
		});
	}

	render() {
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
			<Animated.View style={this.state.visible ? combinedStyle : containerStyle} {...rest}>
				<Text>{this.state.visible ? children : null}</Text>
			</Animated.View>
		);
	}
}
