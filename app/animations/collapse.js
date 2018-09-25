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
		const { animation } = this.state;
		const { open } = this.props;
		const initialValue = !open ? this.height : 0;
		animation.setValue(initialValue);
	}

	componentWillReceiveProps(nextProps) {
		const { animation } = this.state;
		const { open } = this.props;

		if (this.first) {
			this.first = false;
			if (!open) {
				animation.setValue(0);
				return;
			}
		}
		if (this.open === nextProps.open) {
			return;
		}
		this.open = nextProps.open;
		const initialValue = !nextProps.open ? this.height : 0;
		const finalValue = !nextProps.open ? 0 : this.height;

		animation.setValue(initialValue);
		Animated.timing(
			animation,
			{
				toValue: finalValue,
				duration: 150,
				useNativeDriver: true
			}
		).start();
	}

	set _height(h) {
		this.height = h || this.height;
	}

	render() {
		const { animation } = this.state;
		const { style, children } = this.props;

		return (
			<Animated.View
				style={[{ height: animation }, style]}
			>
				<View onLayout={({ nativeEvent }) => this._height = nativeEvent.layout.height} style={{ position: !this.first ? 'relative' : 'absolute' }}>
					{children}
				</View>
			</Animated.View>
		);
	}
}
