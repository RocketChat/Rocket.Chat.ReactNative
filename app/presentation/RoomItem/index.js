import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import {
	View, Text, Dimensions, Animated
} from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles, { ROW_HEIGHT } from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import { CustomIcon } from '../../lib/Icons';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';

export { ROW_HEIGHT };

const attrs = ['name', 'unread', 'userMentions', 'showLastMessage', 'alert', 'type'];
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
		height: PropTypes.number,
		favorite: PropTypes.bool,
		isRead: PropTypes.bool,
		rid: PropTypes.string
	}

	static defaultProps = {
		avatarSize: 48
	}

	// Making jest happy: https://github.com/facebook/react-native/issues/22175
	// eslint-disable-next-line no-useless-constructor
	constructor(props) {
		super(props);
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

	close = () => {
		this.swipeableRow.close();
	};

	toggleFav = async() => {
		try {
			const { rid, favorite } = this.props;
			await RocketChat.toggleFavorite(rid, !favorite);
		} catch (e) {
			log('error_toggle_favorite', e);
		}
		this.close();
	}

	toggleRead = async() => {
		try {
			const { rid, isRead } = this.props;
			await RocketChat.toggleRead(isRead, rid);
		} catch (e) {
			log('error_toggle_read', e);
		}
		this.close();
	}

	renderLeftActions = (progress, dragX) => {
		const { isRead } = this.props;
		const trans = dragX.interpolate({
			inputRange: [0, 80, 81],
			outputRange: [0, 0, 1]
		});
		return (
			<RectButton style={[styles.action, { backgroundColor: '#497AFC' }]}>
				<Animated.View
					style={{ transform: [{ translateX: trans }] }}
				>
					{isRead ? (
						<View style={styles.actionView}>
							<CustomIcon size={15} name='flag' color='white' />
							<Text style={styles.actionText}>Unread</Text>
						</View>
					) : (
						<View style={styles.actionView}>
							<CustomIcon size={15} name='check' color='white' />
							<Text style={styles.actionText}>Read</Text>
						</View>
					)}
				</Animated.View>
			</RectButton>
		);
	};

	renderRightActions = (progress, dragX) => {
		const { favorite } = this.props;
		const { width } = Dimensions.get('window');
		const trans = dragX.interpolate({
			inputRange: [-width, -80, 0],
			outputRange: [0, width - 80, width - 80]
		});
		return (
			<RectButton style={[styles.action, { backgroundColor: '#F4BD3E' }]}>
				<Animated.View
					style={{ transform: [{ translateX: trans }] }}
				>
					{favorite ? (
						<View style={styles.actionView}>
							<CustomIcon size={17} name='Star-filled' color='white' />
							<Text style={styles.actionText}>Unfavorite</Text>
						</View>
					) : (
						<View style={styles.actionView}>
							<CustomIcon size={17} name='star' color='white' />
							<Text style={styles.actionText}>Favorite</Text>
						</View>
					)}
				</Animated.View>
			</RectButton>
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
			unread, userMentions, name, _updatedAt, alert, testID, height, type, avatarSize, baseUrl, userId, username, token, onPress, id, prid, showLastMessage, lastMessage
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
			<Swipeable
				ref={(ref) => { this.swipeableRow = ref; }}
				friction={3}
				leftThreshold={70}
				rightThreshold={70}
				renderLeftActions={this.renderLeftActions}
				renderRightActions={this.renderRightActions}
				overshootRight={false}
				overshootLeft={false}
				onSwipeableLeftOpen={this.toggleRead}
				onSwipeableRightOpen={this.toggleFav}
			>
				<RectButton
					onPress={onPress}
					activeOpacity={0.8}
					underlayColor='#e1e5e8'
					testID={testID}
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
			</Swipeable>
		);
	}
}
