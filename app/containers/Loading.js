import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, View, Modal, Animated
} from 'react-native';

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
		const { opacity, scale } = this.state;
		const { visible } = this.props;

		this.opacityAnimation = Animated.timing(
			opacity,
			{
				toValue: 1,
				duration: 1000,
				useNativeDriver: true
			}
		);
		this.scaleAnimation = Animated.loop(Animated.sequence([
			Animated.timing(
				scale,
				{
					toValue: 0,
					duration: 1000,
					useNativeDriver: true
				}
			),
			Animated.timing(
				scale,
				{
					toValue: 1,
					duration: 1000,
					useNativeDriver: true
				}
			)
		]));

		if (visible) {
			this.startAnimations();
		}
	}

	componentDidUpdate(prevProps) {
		const { visible } = this.props;
		if (visible && visible !== prevProps.visible) {
			this.startAnimations();
		}
	}

	componentWillUnmount() {
		if (this.opacityAnimation && this.opacityAnimation.stop) {
			this.opacityAnimation.stop();
		}
		if (this.scaleAnimation && this.scaleAnimation.stop) {
			this.scaleAnimation.stop();
		}
	}

	startAnimations() {
		if (this.opacityAnimation && this.opacityAnimation.start) {
			this.opacityAnimation.start();
		}
		if (this.scaleAnimation && this.scaleAnimation.start) {
			this.scaleAnimation.start();
		}
	}

	render() {
		const { opacity, scale } = this.state;
		const { visible } = this.props;

		const scaleAnimation = scale.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: [1, 1.1, 1]
		});
		return (
			<Modal
				visible={visible}
				transparent
				onRequestClose={() => {}}
			>
				<View style={styles.container}>
					<Animated.Image
						source={require('../static/images/logo.png')}
						style={[styles.image, {
							opacity,
							transform: [{
								scale: scaleAnimation
							}]
						}]}
					/>
				</View>
			</Modal>
		);
	}
}
