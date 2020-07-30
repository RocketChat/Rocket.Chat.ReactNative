import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import { ROW_HEIGHT } from './styles';
import { formatDate } from '../../utils/room';
import RoomItem from './RoomItem';

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

const RoomItemContainer = React.memo(({
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
		<RoomItem
			name={name}
			avatar={avatar}
			isGroupChat={isGroupChat}
			isRead={isRead}
			onPress={_onPress}
			date={date}
			accessibilityLabel={accessibilityLabel}
			userMentions={item.userMentions}
			width={width}
			favorite={item.f}
			toggleFav={toggleFav}
			rid={item.rid}
			toggleRead={toggleRead}
			hideChannel={hideChannel}
			testID={testID}
			type={item.t}
			theme={theme}
			isFocused={isFocused}
			size={avatarSize}
			baseUrl={baseUrl}
			userId={userId}
			token={token}
			prid={item.prid}
			status={status}
			hideUnreadStatus={item.hideUnreadStatus}
			alert={item.alert}
			roomUpdatedAt={item.roomUpdatedAt}
			lastMessage={item.lastMessage}
			showLastMessage={showLastMessage}
			username={username}
			useRealName={useRealName}
			unread={item.unread}
			groupMentions={item.groupMentions}
		/>
	);
}, arePropsEqual);

RoomItemContainer.propTypes = {
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

RoomItemContainer.defaultProps = {
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

export default connect(mapStateToProps)(RoomItemContainer);
