import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, Animated } from 'react-native';
import { connect } from 'react-redux';
import { RectButton, PanGestureHandler, State } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles, { ROW_HEIGHT } from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import { CustomIcon } from '../../lib/Icons';

export { ROW_HEIGHT };

const OPTION_WIDTH = 80;
const SMALL_SWIPE = 40;
const attrs = ['name', 'unread', 'userMentions', 'showLastMessage', 'alert', 'type', 'width'];
@connect(state => ({
	userId: state.login.user && state.login.user.id,
	username: state.login.user && state.login.user.username,
	token: state.login.user && state.login.user.token
}))
export default class RoomItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		showLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.string,
		lastMessage: PropTypes.object,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		id: PropTypes.string,
		prid: PropTypes.string,
		onPress: PropTypes.func,
		userId: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string,
		avatarSize: PropTypes.number,
		testID: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
		favorite: PropTypes.bool,
		isRead: PropTypes.bool,
		rid: PropTypes.string,
		toggleFav: PropTypes.func,
		toggleRead: PropTypes.func,
		hideChannel: PropTypes.func
	}

	static defaultProps = {
		avatarSize: 48
	}

	// Making jest happy: https://github.com/facebook/react-native/issues/22175
	// eslint-disable-next-line no-useless-constructor
	constructor(props) {
		super(props);
		const dragX = new Animated.Value(0);
		const rowOffSet = new Animated.Value(0);
		this.rowTranslation = Animated.add(
			rowOffSet,
			dragX
		);
		this.state = {
			dragX,
			rowOffSet,
			rowState: 0 // 0: closed, 1: right opened, -1: left opened
		};
		this._onGestureEvent = Animated.event(
			[{ nativeEvent: { translationX: dragX } }]
		);
		this._value = 0;
		this.rowTranslation.addListener(({ value }) => { this._value = value; });
	}

	shouldComponentUpdate(nextProps) {
		const { lastMessage, _updatedAt, isRead } = this.props;
		const oldlastMessage = lastMessage;
		const newLastmessage = nextProps.lastMessage;

		if (oldlastMessage && newLastmessage && oldlastMessage.ts !== newLastmessage.ts) {
			return true;
		}
		if (_updatedAt && nextProps._updatedAt && nextProps._updatedAt !== _updatedAt) {
			return true;
		}
		if (isRead !== nextProps.isRead) {
			return true;
		}
		// eslint-disable-next-line react/destructuring-assignment
		return attrs.some(key => nextProps[key] !== this.props[key]);
	}

	componentWillUnmount() {
		this.rowTranslation.removeAllListeners();
	}

	_onHandlerStateChange = ({ nativeEvent }) => {
		if (nativeEvent.oldState === State.ACTIVE) {
			this._handleRelease(nativeEvent);
		}
	};

	_handleRelease = (nativeEvent) => {
		const { translationX } = nativeEvent;
		const { rowState } = this.state;
		const { width } = this.props;
		const halfScreen = width / 2;
		let toValue = 0;
		if (rowState === 0) { // if no option is opened
			if (translationX > 0 && translationX < halfScreen) {
				toValue = OPTION_WIDTH; // open left option if he swipe right but not enough to trigger action
				this.setState({ rowState: -1 });
			} else if (translationX >= halfScreen) {
				toValue = 0;
				this.toggleRead();
			} else if (translationX < 0 && translationX > -halfScreen) {
				toValue = -2 * OPTION_WIDTH; // open right option if he swipe left
				this.setState({ rowState: 1 });
			} else if (translationX <= -halfScreen) {
				toValue = -width;
				this.hideChannel();
			} else {
				toValue = 0;
			}
		}

		if (rowState === -1) { // if left option is opened
			if (this._value < SMALL_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
			} else if (this._value > halfScreen) {
				toValue = 0;
				this.setState({ rowState: 0 });
				this.toggleRead();
			} else {
				toValue = OPTION_WIDTH;
			}
		}

		if (rowState === 1) { // if right option is opened
			if (this._value > -2 * SMALL_SWIPE) {
				toValue = 0;
				this.setState({ rowState: 0 });
			} else if (this._value < -halfScreen) {
				toValue = 0;
				this.setState({ rowState: 0 });
				this.hideChannel();
			} else {
				toValue = -2 * OPTION_WIDTH;
			}
		}
		this._animateRow(toValue);
	}

	_animateRow = (toValue) => {
		const { dragX, rowOffSet } = this.state;
		rowOffSet.setValue(this._value);
		dragX.setValue(0);
		Animated.spring(rowOffSet, {
			toValue,
			bounciness: 0
		}).start();
	}

	handleLeftButtonPress = () => {
		this.toggleRead();
		this.close();
	}

	close = () => {
		this.setState({ rowState: 0 });
		this._animateRow(0);
	}

	toggleFav = () => {
		const { toggleFav, rid, favorite } = this.props;
		if (toggleFav) {
			toggleFav(rid, favorite);
		}
		this.close();
	}

	toggleRead = () => {
		const { toggleRead, rid, isRead } = this.props;
		if (toggleRead) {
			toggleRead(rid, isRead);
		}
	}

	handleHideButtonPress = () => {
		this.hideChannel();
		this.close();
	}

	hideChannel = () => {
		const { hideChannel, rid, type } = this.props;
		if (hideChannel) {
			hideChannel(rid, type);
		}
	}

	onPress = () => {
		const { rowState } = this.state;
		if (rowState !== 0) {
			this.close();
			return;
		}
		const { onPress } = this.props;
		if (onPress) {
			onPress();
		}
	}

	renderLeftActions = () => {
		const { isRead, width } = this.props;
		const halfWidth = width / 2;
		const trans = this.rowTranslation.interpolate({
			inputRange: [0, OPTION_WIDTH],
			outputRange: [-width, -width + OPTION_WIDTH]
		});

		const iconTrans = this.rowTranslation.interpolate({
			inputRange: [0, OPTION_WIDTH, halfWidth - 1, halfWidth, width],
			outputRange: [0, 0, -(OPTION_WIDTH + 10), 0, 0]
		});
		return (
			<Animated.View
				style={[
					styles.leftAction,
					{ transform: [{ translateX: trans }] }
				]}
			>
				<RectButton style={styles.actionButtonLeft} onPress={this.handleLeftButtonPress}>
					<Animated.View
						style={{ transform: [{ translateX: iconTrans }] }}
					>
						{isRead ? (
							<View style={styles.actionView}>
								<CustomIcon size={20} name='flag' color='white' />
								<Text style={styles.actionText}>{I18n.t('Unread')}</Text>
							</View>
						) : (
							<View style={styles.actionView}>
								<CustomIcon size={20} name='check' color='white' />
								<Text style={styles.actionText}>{I18n.t('Read')}</Text>
							</View>
						)}
					</Animated.View>
				</RectButton>
			</Animated.View>
		);
	};

	renderRightActions = () => {
		const { favorite, width } = this.props;
		const halfWidth = width / 2;
		const trans = this.rowTranslation.interpolate({
			inputRange: [-OPTION_WIDTH, 0],
			outputRange: [width - OPTION_WIDTH, width]
		});
		const iconHideTrans = this.rowTranslation.interpolate({
			inputRange: [-(halfWidth - 20), -2 * OPTION_WIDTH, 0],
			outputRange: [0, 0, -OPTION_WIDTH]
		});
		const iconFavWidth = this.rowTranslation.interpolate({
			inputRange: [-halfWidth, -2 * OPTION_WIDTH, 0],
			outputRange: [0, OPTION_WIDTH, OPTION_WIDTH],
			extrapolate: 'clamp'
		});
		const iconHideWidth = this.rowTranslation.interpolate({
			inputRange: [-width, -halfWidth, -2 * OPTION_WIDTH, 0],
			outputRange: [width, halfWidth, OPTION_WIDTH, OPTION_WIDTH]
		});
		return (
			<Animated.View
				style={[
					styles.rightAction,
					{ transform: [{ translateX: trans }] }
				]}
			>
				<Animated.View
					style={{ width: iconFavWidth }}
				>
					<RectButton style={[styles.actionButtonRightFav]} onPress={this.toggleFav}>
						{favorite ? (
							<View style={styles.actionView}>
								<CustomIcon size={20} name='Star-filled' color='white' />
								<Text style={styles.actionText}>{I18n.t('Unfavorite')}</Text>
							</View>
						) : (
							<View style={styles.actionView}>
								<CustomIcon size={20} name='star' color='white' />
								<Text style={styles.actionText}>{I18n.t('Favorite')}</Text>
							</View>
						)}
					</RectButton>
				</Animated.View>
				<Animated.View style={[
					{ width: iconHideWidth },
					{ transform: [{ translateX: iconHideTrans }] }
				]}
				>
					<RectButton
						style={[styles.actionButtonRightHide]}
						onPress={this.handleHideButtonPress}
					>
						<View style={styles.actionView}>
							<CustomIcon size={20} name='eye-off' color='white' />
							<Text style={styles.actionText}>{I18n.t('Hide')}</Text>
						</View>
					</RectButton>
				</Animated.View>
			</Animated.View>
		);
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			unread, userMentions, name, _updatedAt, alert, testID, height, type, avatarSize, baseUrl, userId, username, token, id, prid, showLastMessage, lastMessage
		} = this.props;

		const date = this.formatDate(_updatedAt);

		let accessibilityLabel = name;
		if (unread === 1) {
			accessibilityLabel += `, ${ unread } ${ I18n.t('alert') }`;
		} else if (unread > 1) {
			accessibilityLabel += `, ${ unread } ${ I18n.t('alerts') }`;
		}

		if (userMentions > 0) {
			accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
		}

		if (date) {
			accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
		}

		return (
			<PanGestureHandler
				minDeltaX={10}
				onGestureEvent={this._onGestureEvent}
				onHandlerStateChange={this._onHandlerStateChange}
			>
				<View style={styles.upperContainer}>
					{this.renderLeftActions()}
					{this.renderRightActions()}
					<Animated.View
						style={
							{
								transform: [{ translateX: this.rowTranslation }]
							}
						}
					>
						<RectButton
							onPress={this.onPress}
							activeOpacity={0.8}
							underlayColor='#e1e5e8'
							testID={testID}
							style={styles.button}
						>
							<View
								style={[styles.container, height && { height }]}
								accessibilityLabel={accessibilityLabel}
							>
								<Avatar text={name} size={avatarSize} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
								<View style={styles.centerContainer}>
									<View style={styles.titleContainer}>
										<TypeIcon type={type} id={id} prid={prid} />
										<Text style={[styles.title, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
										{_updatedAt ? <Text style={[styles.date, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
									</View>
									<View style={styles.row}>
										<LastMessage lastMessage={lastMessage} type={type} showLastMessage={showLastMessage} username={username} alert={alert} />
										<UnreadBadge unread={unread} userMentions={userMentions} type={type} />
									</View>
								</View>
							</View>
						</RectButton>
					</Animated.View>
				</View>
			</PanGestureHandler>
		);
	}
}
