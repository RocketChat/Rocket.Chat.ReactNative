import React, { Component } from 'react';
import {
	Text, StyleSheet, ActivityIndicator, Animated, Easing
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import I18n from '../i18n';
import debounce from '../utils/debounce';
import sharedStyles from '../views/Styles';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_DANGER, COLOR_SUCCESS, COLOR_WHITE, COLOR_TEXT_DESCRIPTION
} from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		width: '100%',
		position: 'absolute',
		top: 0,
		height: 41,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 4
	},
	text: {
		color: COLOR_WHITE,
		fontSize: 15,
		...sharedStyles.textRegular
	},
	textConnecting: {
		...sharedStyles.textColorDescription
	},
	containerConnected: {
		backgroundColor: COLOR_SUCCESS
	},
	containerOffline: {
		backgroundColor: COLOR_DANGER
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
		disconnected: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
		if (props.connecting) {
			this.show();
		}
	}

	componentDidUpdate() {
		const { connected, disconnected } = this.props;
		this.show(connected || disconnected);
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	// eslint-disable-next-line react/sort-comp
	animate = debounce((toValue, autoHide) => {
		Animated.timing(
			this.animatedValue,
			{
				toValue,
				duration: ANIMATION_DURATION,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start(() => {
			if (toValue === 1 && autoHide) {
				if (this.timeout) {
					clearTimeout(this.timeout);
				}
				this.timeout = setTimeout(() => {
					this.hide();
				}, 1000);
			}
		});
	}, 300);

	show = (autoHide) => {
		this.animate(1, autoHide);
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
				<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
					<ActivityIndicator color={COLOR_TEXT_DESCRIPTION} style={styles.activityIndicator} />
					<Text style={[styles.text, styles.textConnecting]}>{I18n.t('Connecting')}</Text>
				</Animated.View>
			);
		} else if (connected) {
			return (
				<Animated.View style={[styles.container, styles.containerConnected, { transform: [{ translateY }] }]}>
					<Text style={styles.text}>{I18n.t('Connected')}</Text>
				</Animated.View>
			);
		}

		return (
			<Animated.View style={[styles.container, styles.containerOffline, { transform: [{ translateY }] }]}>
				<Text style={styles.text}>{I18n.t('Offline')}</Text>
			</Animated.View>
		);
	}
}

export default ConnectionBadge;
