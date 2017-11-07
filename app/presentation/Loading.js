import React, { Component } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const logo = require('../images/logo.png');


const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	background: {
		width: Dimensions.get('window').width,
		height: Dimensions.get('window').height,
		alignItems: 'center',
		justifyContent: 'center'
	},
	logo: {
		width: Dimensions.get('window').width - 100,
		height: Dimensions.get('window').width - 100,
		resizeMode: 'contain'
	}
});

export default class Loading extends Component {
	constructor(props) {
		super(props);

		this.scale = new Animated.Value(1.0);
	}

	componentDidMount() {
		requestAnimationFrame(() => {
			this.animate();
		});
	}

	animate = () => {
		Animated.sequence([
			Animated.timing(
				this.scale,
				{
					toValue: 0.8,
					duration: 1000,
					useNativeDriver: true
				}),
			Animated.timing(
				this.scale,
				{
					toValue: 1,
					duration: 1000,
					useNativeDriver: true
				})
		]).start(() => {
			this.animate();
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<Animated.Image
					style={[
						styles.logo,
						{
							transform: [
								{ scale: this.scale }
							]
						}]}
					source={logo}
				/>
			</View>
		);
	}
}
