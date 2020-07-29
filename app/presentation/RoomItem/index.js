import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';

import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles, { ROW_HEIGHT } from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import { capitalize, formatDate } from '../../utils/room';
import Touchable from './Touchable';
import { themes } from '../../constants/colors';

export { ROW_HEIGHT };

const attrs = [
	'width',
	'status',
	'connected',
	'theme',
	'isFocused',
	'forceUpdate',
	'showLastMessage'
];

const arePropsEqual = (oldProps, newProps) => attrs.every(key => oldProps[key] === newProps[key]);

const RoomItem = React.memo(({
	item,
	onPress,
	width,
	toggleFav,
	toggleRead,
	hideChannel,
	testID,
	avatarSize,
	baseUrl,
	userId,
	username,
	token,
	id,
	showLastMessage,
	status,
	useRealName,
	getUserPresence,
	connected,
	theme,
	isFocused,
	getRoomTitle,
	getRoomAvatar,
	getIsGroupChat,
	getIsRead
}) => {
	const [, setForceUpdate] = useState(1);

	useEffect(() => {
		if (connected && item.t === 'd' && id) {
			getUserPresence(id);
		}
	}, [connected]);

	useEffect(() => {
		if (item?.observe) {
			const observable = item.observe();
			const subscription = observable?.subscribe?.(() => {
				setForceUpdate(prevForceUpdate => prevForceUpdate + 1);
			});

			return () => {
				subscription?.unsubscribe?.();
			};
		}
	}, []);

	const name = getRoomTitle(item);
	const avatar = getRoomAvatar(item);
	const isGroupChat = getIsGroupChat(item);
	const isRead = getIsRead(item);
	const _onPress = () => onPress(item);
	const date = item.lastMessage?.ts && formatDate(item.lastMessage.ts);

	let accessibilityLabel = name;
	if (item.unread === 1) {
		accessibilityLabel += `, ${ item.unread } ${ I18n.t('alert') }`;
	} else if (item.unread > 1) {
		accessibilityLabel += `, ${ item.unread } ${ I18n.t('alerts') }`;
	}

	if (item.userMentions > 0) {
		accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
	}

	if (date) {
		accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
	}

	return (
		<Touchable
			onPress={_onPress}
			width={width}
			favorite={item.f}
			toggleFav={toggleFav}
			isRead={isRead}
			rid={item.rid}
			toggleRead={toggleRead}
			hideChannel={hideChannel}
			testID={testID}
			type={item.t}
			theme={theme}
			isFocused={isFocused}
		>
			<View
				style={styles.container}
				accessibilityLabel={accessibilityLabel}
			>
				<Avatar
					text={avatar}
					size={avatarSize}
					type={item.t}
					baseUrl={baseUrl}
					style={styles.avatar}
					userId={userId}
					token={token}
				/>
				<View
					style={[
						styles.centerContainer,
						{
							borderColor: themes[theme].separatorColor
						}
					]}
				>
					<View style={styles.titleContainer}>
						<TypeIcon
							type={item.t}
							prid={item.prid}
							status={status}
							isGroupChat={isGroupChat}
							theme={theme}
						/>
						<Text
							style={[
								styles.title,
								item.alert && !item.hideUnreadStatus && styles.alert,
								{ color: themes[theme].titleText }
							]}
							ellipsizeMode='tail'
							numberOfLines={1}
						>
							{name}
						</Text>
						{item.roomUpdatedAt ? (
							<Text
								style={[
									styles.date,
									{
										color:
											themes[theme]
												.auxiliaryText
									},
									item.alert && !item.hideUnreadStatus && [
										styles.updateAlert,
										{
											color:
												themes[theme]
													.tintColor
										}
									]
								]}
								ellipsizeMode='tail'
								numberOfLines={1}
							>
								{capitalize(date)}
							</Text>
						) : null}
					</View>
					<View style={styles.row}>
						<LastMessage
							lastMessage={item.lastMessage}
							type={item.t}
							showLastMessage={showLastMessage}
							username={username}
							alert={item.alert && !item.hideUnreadStatus}
							useRealName={useRealName}
							theme={theme}
						/>
						<UnreadBadge
							unread={item.unread}
							userMentions={item.userMentions}
							groupMentions={item.groupMentions}
							theme={theme}
						/>
					</View>
				</View>
			</View>
		</Touchable>
	);
}, arePropsEqual);

RoomItem.propTypes = {
	item: PropTypes.object.isRequired,
	baseUrl: PropTypes.string.isRequired,
	showLastMessage: PropTypes.bool,
	id: PropTypes.string,
	onPress: PropTypes.func,
	userId: PropTypes.string,
	username: PropTypes.string,
	token: PropTypes.string,
	avatarSize: PropTypes.number,
	testID: PropTypes.string,
	width: PropTypes.number,
	status: PropTypes.string,
	toggleFav: PropTypes.func,
	toggleRead: PropTypes.func,
	hideChannel: PropTypes.func,
	useRealName: PropTypes.bool,
	getUserPresence: PropTypes.func,
	connected: PropTypes.bool,
	theme: PropTypes.string,
	isFocused: PropTypes.bool,
	getRoomTitle: PropTypes.func,
	getRoomAvatar: PropTypes.func,
	getIsGroupChat: PropTypes.func,
	getIsRead: PropTypes.func
};

RoomItem.defaultProps = {
	avatarSize: 48,
	status: 'offline',
	getUserPresence: () => {},
	getRoomTitle: () => 'title',
	getRoomAvatar: () => '',
	getIsGroupChat: () => false,
	getIsRead: () => false
};

const mapStateToProps = (state, ownProps) => {
	let status = 'offline';
	const { id, type, visitor = {} } = ownProps;
	if (state.meteor.connected) {
		if (type === 'd') {
			status = state.activeUsers[id]?.status || 'offline';
		} else if (type === 'l' && visitor?.status) {
			({ status } = visitor);
		}
	}
	return {
		connected: state.meteor.connected,
		status
	};
};

export default connect(mapStateToProps)(RoomItem);
