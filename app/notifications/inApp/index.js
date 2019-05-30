import React from 'react';
import {
	View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import { withNavigation, NavigationActions } from 'react-navigation';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_TITLE, COLOR_TEXT, COLOR_BACKGROUND_CONTAINER } from '../../constants/colors';
import Avatar from '../../containers/Avatar';

const AVATAR_SIZE = 40;
const ANIMATION_DURATION = 300;
const { width } = Dimensions.get('window');
const MAX_WIDTH_MESSAGE = width - 100;
let timeout;

const styles = StyleSheet.create({
	container: {
		minHeight: 55,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'absolute',
		zIndex: 2,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		width: '100%'
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomName: {
		color: COLOR_TEXT
	},
	message: {
		maxWidth: MAX_WIDTH_MESSAGE
	},
	close: {
		color: COLOR_TITLE,
		marginHorizontal: 10
	}
});
@connect(state => ({
	userId: state.login.user && state.login.user.id,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	token: state.login.user && state.login.user.token,
	notification: state.notification
}))
class NotificationBadge extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		notification: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	shouldComponentUpdate(nextProps) {
		const { notification: nextNotification } = nextProps;
		const { notification: { payload }, navigation } = this.props;
		const navState = navigation.state;
		if	(!nextNotification.payload) {
			return false;
		}
		if (navState && navState.routeName === 'RoomView' && navState.params.rid === nextNotification.payload.rid) {
			return false;
		}
		if (!equal(nextNotification.payload, payload)) {
			return true;
		}
		return false;
	}

	componentDidUpdate() {
		this.show();
	}

	show = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start(() => {
			if	(timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(() => {
				this.hide();
			}, 5000);
		});
	}

	hide = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start();
	}

	goToRoom = () => {
		const { notification: { payload }, navigation } = this.props;
		const { rid, type, prid } = payload;
		const name = payload === 'p' ? payload.name : payload.sender.username;
		navigation.reset([NavigationActions.navigate({
			routeName: 'RoomView',
			params: {
				rid, name, t: type, prid
			}
		})]);
		this.hide();
	}

	render() {
		const {
			baseUrl, token, userId, notification
		} = this.props;
		const { message, payload } = notification;
		if	(!payload) {
			return null;
		}
		const { type } = payload;
		const name = payload === 'p' ? payload.name : payload.sender.username;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-55, 0]
		});

		return (
			<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
				<TouchableOpacity style={styles.content} onPress={this.goToRoom}>
					<Avatar text={name} size={AVATAR_SIZE} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
					<View>
						<Text style={styles.roomName}>{name}</Text>
						<Text style={styles.message} numberOfLines={1}>{message}</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity onPress={this.hide}>
					<CustomIcon name='circle-cross' style={styles.close} size={20} />
				</TouchableOpacity>
			</Animated.View>
		);
	}
}

export default withNavigation(NotificationBadge);
