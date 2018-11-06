import React, { Component } from 'react';
import {
	Text, StyleSheet, ActivityIndicator, Animated, TouchableWithoutFeedback, Easing
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import I18n from '../i18n';
import debounce from '../utils/debounce';

const styles = StyleSheet.create({
	container: {
		width: '100%',
		position: 'absolute',
		top: 0,
		height: 41,
		backgroundColor: '#F7F8FA',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 4
	},
	text: {
		color: '#fff',
		fontSize: 15,
		fontWeight: 'normal'
	},
	textConnecting: {
		color: '#9EA2A8'
	},
	containerConnected: {
		backgroundColor: '#2de0a5'
	},
	containerOffline: {
		backgroundColor: '#f5455c'
	},
	activityIndicator: {
		marginRight: 15
	}
});

const ANIMATION_DURATION = 300;

@connect(state => ({
	connecting: state.meteor.connecting,
	connected: state.meteor.connected,
	disconnected: !state.meteor.connecting && !state.meteor.connected
}))
class ConnectionBadge extends Component {
	static propTypes = {
		connecting: PropTypes.bool,
		connected: PropTypes.bool,
		disconnected: PropTypes.bool // eslint-disable-line
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidUpdate() {
		this.show();
	}

	// eslint-disable-next-line react/sort-comp
	animate = debounce((toValue) => {
		Animated.timing(
			this.animatedValue,
			{
				toValue,
				duration: ANIMATION_DURATION,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start(() => {
			if (toValue === 1) {
				if (this.timeout) {
					clearTimeout(this.timeout);
				}
				this.timeout = setTimeout(() => {
					this.hide();
				}, 1000);
			}
		});
	}, 300);

	show = () => {
		this.animate(1);
	}

	hide = () => {
		this.animate(0);
	}

	render() {
		const { connecting, connected } = this.props;

		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-42, 0]
		});

		if (connecting) {
			return (
				<TouchableWithoutFeedback onPress={this.hide}>
					<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
						<ActivityIndicator color='#9EA2A8' style={styles.activityIndicator} />
						<Text style={[styles.text, styles.textConnecting]}>{I18n.t('Connecting')}</Text>
					</Animated.View>
				</TouchableWithoutFeedback>
			);
		} else if (connected) {
			return (
				<TouchableWithoutFeedback onPress={this.hide}>
					<Animated.View style={[styles.container, styles.containerConnected, { transform: [{ translateY }] }]}>
						<Text style={styles.text}>{I18n.t('Connected')}</Text>
					</Animated.View>
				</TouchableWithoutFeedback>
			);
		}

		return (
			<TouchableWithoutFeedback onPress={this.hide}>
				<Animated.View style={[styles.container, styles.containerOffline, { transform: [{ translateY }] }]}>
					<Text style={styles.text}>{I18n.t('Offline')}</Text>
				</Animated.View>
			</TouchableWithoutFeedback>
		);
	}
}

export default ConnectionBadge;
