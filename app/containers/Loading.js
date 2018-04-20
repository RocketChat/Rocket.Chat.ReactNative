import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Modal, Animated } from 'react-native';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.25)'
	},
	image: {
		width: 100,
		height: 100,
		resizeMode: 'contain'
	}
});

export default class Loading extends React.PureComponent {
	static propTypes = {
		visible: PropTypes.bool.isRequired
	}

	state = {
		scale: new Animated.Value(1),
		opacity: new Animated.Value(0)
	}

	componentDidMount() {
		this.opacityAnimation = Animated.timing(
			this.state.opacity,
			{
				toValue: 1,
				duration: 1000,
				useNativeDriver: true
			}
		);
		this.scaleAnimation = Animated.loop(Animated.sequence([
			Animated.timing(
				this.state.scale,
				{
					toValue: 0,
					duration: 1000,
					useNativeDriver: true
				}
			),
			Animated.timing(
				this.state.scale,
				{
					toValue: 1,
					duration: 1000,
					useNativeDriver: true
				}
			)
		]));

		if (this.props.visible) {
			this.startAnimations();
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.visible && this.props.visible !== prevProps.visible) {
			this.startAnimations();
		}
	}

	componentWillUnmount() {
		this.opacityAnimation.stop();
		this.scaleAnimation.stop();
	}

	startAnimations() {
		this.opacityAnimation.start();
		this.scaleAnimation.start();
	}

	render() {
		const scale = this.state.scale.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: [1, 1.1, 1]
		});
		return (
			<Modal
				visible={this.props.visible}
				transparent
				onRequestClose={() => {}}
			>
				<View style={styles.container}>
					<Animated.Image
						source={require('../static/images/logo.png')}
						style={[styles.image, {
							opacity: this.state.opacity,
							transform: [{
								scale
							}]
						}]}
					/>
				</View>
			</Modal>
		);
	}
}
