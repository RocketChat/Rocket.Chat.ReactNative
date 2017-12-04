import { View, Animated } from 'react-native';

import PropTypes from 'prop-types';
import React from 'react';

export default class Panel extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		children: PropTypes.node.isRequired,
		style: PropTypes.object
	}
	constructor(props) {
		super(props);
		this.state = {
			animation: new Animated.Value()
		};
		this.first = true;
		this.open = false;
		this.opacity = 0;
	}
	componentDidMount() {
		const initialValue = !this.props.open ? this.height : 0;
		this.state.animation.setValue(initialValue);
	}
	componentWillReceiveProps(nextProps) {
		if (this.first) {
			this.first = false;
			if (!this.props.open) {
				this.state.animation.setValue(0);
				return;
			}
		}
		if (this.open === nextProps.open) {
			return;
		}
		this.open = nextProps.open;
		const initialValue = !nextProps.open ? this.height : 0;
		const finalValue = !nextProps.open ? 0 : this.height;

		this.state.animation.setValue(initialValue);
		Animated.timing(
			this.state.animation,
			{
				toValue: finalValue,
				duration: 150
			}
		).start();
	}
	set _height(h) {
		this.height = h || this.height;
	}
	render() {
		return (
			<Animated.View
				style={[{ height: this.state.animation }, this.props.style]}
			>
				<View onLayout={({ nativeEvent }) => this._height = nativeEvent.layout.height} style={{ position: !this.first ? 'relative' : 'absolute' }}>
					{this.props.children}
				</View>
			</Animated.View>
		);
	}
}
