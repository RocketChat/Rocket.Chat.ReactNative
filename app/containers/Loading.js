import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, Modal, Animated, View
} from 'react-native';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	image: {
		width: 100,
		height: 100,
		resizeMode: 'contain'
	}
});

class Loading extends React.PureComponent {
	static propTypes = {
		visible: PropTypes.bool,
		theme: PropTypes.string
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
				duration: 200,
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
		const { visible, theme } = this.props;

		const scaleAnimation = scale.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: [1, 1.1, 1]
		});

		const opacityAnimation = opacity.interpolate({
			inputRange: [0, 1],
			outputRange: [0, themes[theme].backdropOpacity],
			extrapolate: 'clamp'
		});

		return (
			<Modal
				visible={visible}
				transparent
				onRequestClose={() => {}}
			>
				<View
					style={styles.container}
					testID='loading'
				>
					<Animated.View
						style={[{
							...StyleSheet.absoluteFill,
							backgroundColor: themes[theme].backdropColor,
							opacity: opacityAnimation
						}]}
					/>
					<Animated.Image
						source={require('../static/images/logo.png')}
						style={[styles.image, {
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

export default (withTheme(Loading));
