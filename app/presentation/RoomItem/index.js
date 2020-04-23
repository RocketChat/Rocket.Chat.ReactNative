import React, { useEffect } from 'react';
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
	'name',
	'unread',
	'userMentions',
	'showLastMessage',
	'useRealName',
	'alert',
	'type',
	'width',
	'isRead',
	'favorite',
	'status',
	'connected',
	'theme'
];

const arePropsEqual = (oldProps, newProps) => {
	const { _updatedAt: _updatedAtOld } = oldProps;
	const { _updatedAt: _updatedAtNew } = newProps;
	if (_updatedAtOld && _updatedAtNew && _updatedAtOld.toISOString() !== _updatedAtNew.toISOString()) {
		return false;
	}
	return attrs.every(key => oldProps[key] === newProps[key]);
};

const RoomItem = React.memo(({
	onPress, width, favorite, toggleFav, isRead, rid, toggleRead, hideChannel, testID, unread, userMentions, name, _updatedAt, alert, type, avatarSize, baseUrl, userId, username, token, id, prid, showLastMessage, hideUnreadStatus, lastMessage, status, avatar, useRealName, getUserPresence, isGroupChat, connected, theme
}) => {
	useEffect(() => {
		if (connected && type === 'd' && id) {
			getUserPresence(id);
		}
	}, [connected]);

	const date = lastMessage && formatDate(lastMessage.ts);

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
		<Touchable
			onPress={onPress}
			width={width}
			favorite={favorite}
			toggleFav={toggleFav}
			isRead={isRead}
			rid={rid}
			toggleRead={toggleRead}
			hideChannel={hideChannel}
			testID={testID}
			type={type}
			theme={theme}
		>
			<View
				style={styles.container}
				accessibilityLabel={accessibilityLabel}
			>
				<Avatar
					text={avatar}
					size={avatarSize}
					type={type}
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
							type={type}
							prid={prid}
							status={status}
							isGroupChat={isGroupChat}
							theme={theme}
						/>
						<Text
							style={[
								styles.title,
								alert && !hideUnreadStatus && styles.alert,
								{ color: themes[theme].titleText }
							]}
							ellipsizeMode='tail'
							numberOfLines={1}
						>
							{name}
						</Text>
						{_updatedAt ? (
							<Text
								style={[
									styles.date,
									{
										color:
											themes[theme]
												.auxiliaryText
									},
									alert && !hideUnreadStatus && [
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
							lastMessage={lastMessage}
							type={type}
							showLastMessage={showLastMessage}
							username={username}
							alert={alert && !hideUnreadStatus}
							useRealName={useRealName}
							theme={theme}
						/>
						<UnreadBadge
							unread={unread}
							userMentions={userMentions}
							type={type}
							theme={theme}
						/>
					</View>
				</View>
			</View>
		</Touchable>
	);
}, arePropsEqual);

RoomItem.propTypes = {
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
	favorite: PropTypes.bool,
	isRead: PropTypes.bool,
	rid: PropTypes.string,
	status: PropTypes.string,
	toggleFav: PropTypes.func,
	toggleRead: PropTypes.func,
	hideChannel: PropTypes.func,
	avatar: PropTypes.bool,
	hideUnreadStatus: PropTypes.bool,
	useRealName: PropTypes.bool,
	getUserPresence: PropTypes.func,
	connected: PropTypes.bool,
	isGroupChat: PropTypes.bool,
	theme: PropTypes.string
};

RoomItem.defaultProps = {
	avatarSize: 48,
	status: 'offline',
	getUserPresence: () => {}
};

const mapStateToProps = (state, ownProps) => ({
	connected: state.meteor.connected,
	status:
		state.meteor.connected && ownProps.type === 'd'
			? state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status
			: 'offline'
});

export default connect(mapStateToProps)(RoomItem);
