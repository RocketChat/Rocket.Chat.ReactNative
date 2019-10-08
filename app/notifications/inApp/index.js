import React from 'react';
import {
	View, Text, StyleSheet, TouchableOpacity, Animated, Easing
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { responsive } from 'react-native-responsive-ui';
import Touchable from 'react-native-platform-touchable';

import { isNotch, isIOS } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_BACKGROUND_NOTIFICATION, COLOR_SEPARATOR, COLOR_TEXT } from '../../constants/colors';
import Avatar from '../../containers/Avatar';
import { removeNotification as removeNotificationAction } from '../../actions/notification';
import sharedStyles from '../../views/Styles';
import { ROW_HEIGHT } from '../../presentation/RoomItem';

const AVATAR_SIZE = 48;
const ANIMATION_DURATION = 300;
const NOTIFICATION_DURATION = 3000;
const BUTTON_HIT_SLOP = {
	top: 12, right: 12, bottom: 12, left: 12
};
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};

const styles = StyleSheet.create({
	container: {
		height: ROW_HEIGHT,
		paddingHorizontal: 14,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'absolute',
		zIndex: 2,
		backgroundColor: COLOR_BACKGROUND_NOTIFICATION,
		width: '100%',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginRight: 10
	},
	roomName: {
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	message: {
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal
	},
	close: {
		color: COLOR_TEXT,
		marginLeft: 10
	}
});

class NotificationBadge extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		notification: PropTypes.object,
		window: PropTypes.object,
		removeNotification: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	shouldComponentUpdate(nextProps) {
		const { notification: nextNotification } = nextProps;
		const {
			notification: { payload }, window
		} = this.props;
		if (!equal(nextNotification.payload, payload)) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		return false;
	}

	componentDidUpdate() {
		const { notification: { payload }, navigation } = this.props;
		const navState = this.getNavState(navigation.state);
		if (payload.rid) {
			if (navState && navState.routeName === 'RoomView' && navState.params && navState.params.rid === payload.rid) {
				return;
			}
			this.show();
		}
	}

	componentWillUnmount() {
		this.clearTimeout();
	}

	show = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				...ANIMATION_PROPS
			},
		).start(() => {
			this.clearTimeout();
			this.timeout = setTimeout(() => {
				this.hide();
			}, NOTIFICATION_DURATION);
		});
	}

	hide = () => {
		const { removeNotification } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				...ANIMATION_PROPS
			},
		).start();
		setTimeout(removeNotification, ANIMATION_DURATION);
	}

	clearTimeout = () => {
		if	(this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	getNavState = (routes) => {
		if (!routes.routes) {
			return routes;
		}
		return this.getNavState(routes.routes[routes.index]);
	}

	goToRoom = async() => {
		const { notification: { payload }, navigation } = this.props;
		const { rid, type, prid } = payload;
		if (!rid) {
			return;
		}
		const name = type === 'p' ? payload.name : payload.sender.username;
		await navigation.navigate('RoomsListView');
		navigation.navigate('RoomView', {
			rid, name, t: type, prid
		});
		this.hide();
	}

	render() {
		const {
			baseUrl, token, userId, notification, window
		} = this.props;
		const { message, payload } = notification;
		const { type } = payload;
		const name = type === 'p' ? payload.name : payload.sender.username;

		let top = 0;
		if (isIOS) {
			const portrait = window.height > window.width;
			if (portrait) {
				top = isNotch ? 45 : 20;
			} else {
				top = 0;
			}
		}

		const maxWidthMessage = window.width - 110;

		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-top - ROW_HEIGHT, top]
		});
		return (
			<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
				<Touchable
					style={styles.content}
					onPress={this.goToRoom}
					hitSlop={BUTTON_HIT_SLOP}
					background={Touchable.SelectableBackgroundBorderless()}
				>
					<>
						<Avatar text={name} size={AVATAR_SIZE} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
						<View>
							<Text style={styles.roomName}>{name}</Text>
							<Text style={[styles.message, { maxWidth: maxWidthMessage }]} numberOfLines={1}>{message}</Text>
						</View>
					</>
				</Touchable>
				<TouchableOpacity onPress={this.hide}>
					<CustomIcon name='circle-cross' style={styles.close} size={20} />
				</TouchableOpacity>
			</Animated.View>
		);
	}
}

const mapStateToProps = state => ({
	userId: state.login.user && state.login.user.id,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	token: state.login.user && state.login.user.token,
	notification: state.notification
});

const mapDispatchToProps = dispatch => ({
	removeNotification: () => dispatch(removeNotificationAction())
});

export default responsive(connect(mapStateToProps, mapDispatchToProps)(NotificationBadge));
