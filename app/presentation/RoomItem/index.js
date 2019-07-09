import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import Animated from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import Interactable from './Interactable';

import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles, { ROW_HEIGHT, OPTION_WIDTH } from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import { CustomIcon } from '../../lib/Icons';

export { ROW_HEIGHT };

const attrs = ['name', 'unread', 'userMentions', 'showLastMessage', 'alert', 'type', 'width'];
const SNAP_POINTS = [
	{
		x: OPTION_WIDTH,
		damping: 0.7,
		tension: 300
	},
	{
		x: 0,
		damping: 0.7,
		tension: 300
	},
	{
		x: -OPTION_WIDTH * 2,
		damping: 0.7,
		tension: 300
	}
];
const LONG_SWIPE = OPTION_WIDTH * 3;
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

	constructor(props) {
		super(props);
		this._deltaX = new Animated.Value(0);
		this.state = {
			position: 1
		};
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

	close = () => this.interactableElem && this.interactableElem._snapAnchor && this.interactableElem._snapAnchor.x && this.interactableElem._snapAnchor.x.setValue(0)

	toggleFav = () => {
		this.close();
		const { toggleFav, rid, favorite } = this.props;
		if (toggleFav) {
			toggleFav(rid, favorite);
		}
	}

	toggleRead = () => {
		this.close();
		const { toggleRead, rid, isRead } = this.props;
		if (toggleRead) {
			toggleRead(rid, isRead);
		}
	}

	hideChannel = () => {
		this.close();
		const { hideChannel, rid, type } = this.props;
		if (hideChannel) {
			hideChannel(rid, type);
		}
	}

	onPress = () => {
		const { position } = this.state;
		if (position !== 1) {
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
		const translateX = this._deltaX.interpolate({
			inputRange: [0, OPTION_WIDTH],
			outputRange: [0, OPTION_WIDTH]
		});
		const translateXIcon = this._deltaX.interpolate({
			inputRange: [0, OPTION_WIDTH, LONG_SWIPE - 2, LONG_SWIPE],
			outputRange: [0, 0, -LONG_SWIPE + OPTION_WIDTH + 2, 0],
			extrapolate: Animated.Extrapolate.CLAMP
		});
		return (
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{
						left: -width,
						width,
						transform: [{ translateX }]
					}
				]}
			>
				<Animated.View
					style={{
						position: 'absolute',
						height: '100%',
						left: width - OPTION_WIDTH,
						transform: [{ translateX: translateXIcon }]
					}}
				>
					<RectButton style={styles.actionButton} onPress={this.toggleRead}>
						<React.Fragment>
							<CustomIcon size={20} name={isRead ? 'flag' : 'check'} color='white' />
							<Text style={styles.actionText}>{I18n.t(isRead ? 'Unread' : 'Read')}</Text>
						</React.Fragment>
					</RectButton>
				</Animated.View>
			</Animated.View>
		);
	};

	renderRightActions = () => {
		const { favorite, width } = this.props;
		const translateXFav = this._deltaX.interpolate({
			inputRange: [-OPTION_WIDTH, 0],
			outputRange: [-OPTION_WIDTH, 0]
		});
		const translateXHide = this._deltaX.interpolate({
			inputRange: [-width, -LONG_SWIPE, -OPTION_WIDTH * 2, -OPTION_WIDTH, 0],
			outputRange: [-width, -LONG_SWIPE, -OPTION_WIDTH, -OPTION_WIDTH / 2, 0]
		});
		return (
			<React.Fragment>
				<Animated.View
					style={[
						styles.actionRightButtonContainer,
						{
							left: width,
							width,
							backgroundColor: '#ffbb00',
							transform: [{ translateX: translateXFav }]
						}
					]}
				>
					<RectButton style={styles.actionButton} onPress={this.toggleFav}>
						<React.Fragment>
							<CustomIcon size={20} name={favorite ? 'Star-filled' : 'star'} color='white' />
							<Text style={styles.actionText}>{I18n.t(favorite ? 'Unfavorite' : 'Favorite')}</Text>
						</React.Fragment>
					</RectButton>
				</Animated.View>
				<Animated.View
					style={[
						styles.actionRightButtonContainer,
						{
							left: width,
							width,
							backgroundColor: '#54585e',
							transform: [{ translateX: translateXHide }]
						}
					]}
				>
					<RectButton style={styles.actionButton} onPress={this.hideChannel}>
						<React.Fragment>
							<CustomIcon size={20} name='eye-off' color='white' />
							<Text style={styles.actionText}>{I18n.t('Hide')}</Text>
						</React.Fragment>
					</RectButton>
				</Animated.View>
			</React.Fragment>
		);
	};

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	onSnap = ({ nativeEvent }) => {
		const { index } = nativeEvent;
		this.setState({ position: index });
	}

	onDrag = (e) => {
		const { state, x } = e.nativeEvent;
		if (state === 'end') {
			if (x >= LONG_SWIPE) {
				this.toggleRead();
			}
			if (x <= -LONG_SWIPE) {
				this.hideChannel();
			}
		}
	}

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
			<View>
				{this.renderLeftActions()}
				{this.renderRightActions()}
				<Interactable.View
					ref={el => (this.interactableElem = el)}
					horizontalOnly
					snapPoints={SNAP_POINTS}
					animatedValueX={this._deltaX}
					onDrag={this.onDrag}
					onSnap={this.onSnap}
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
				</Interactable.View>
			</View>
		);
	}
}
