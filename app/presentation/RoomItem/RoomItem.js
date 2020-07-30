import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import { capitalize } from '../../utils/room';
import Touchable from './Touchable';
import { themes } from '../../constants/colors';

const RoomItem = ({
	rid,
	type,
	prid,
	name,
	avatar,
	width,
	avatarSize,
	baseUrl,
	userId,
	username,
	token,
	showLastMessage,
	status,
	useRealName,
	theme,
	isFocused,
	isGroupChat,
	isRead,
	date,
	accessibilityLabel,
	favorite,
	lastMessage,
	alert,
	hideUnreadStatus,
	unread,
	userMentions,
	groupMentions,
	roomUpdatedAt,
	testID,
	onPress,
	toggleFav,
	toggleRead,
	hideChannel
}) => (
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
		isFocused={isFocused}
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
					{roomUpdatedAt ? (
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
						groupMentions={groupMentions}
						theme={theme}
					/>
				</View>
			</View>
		</View>
	</Touchable>
);

RoomItem.propTypes = {
	rid: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	prid: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	avatar: PropTypes.string.isRequired,
	baseUrl: PropTypes.string.isRequired,
	showLastMessage: PropTypes.bool,
	userId: PropTypes.string,
	username: PropTypes.string,
	token: PropTypes.string,
	avatarSize: PropTypes.number,
	testID: PropTypes.string,
	width: PropTypes.number,
	status: PropTypes.string,
	useRealName: PropTypes.bool,
	theme: PropTypes.string,
	isFocused: PropTypes.bool,
	isGroupChat: PropTypes.bool,
	isRead: PropTypes.bool,
	date: PropTypes.instanceOf(Date),
	accessibilityLabel: PropTypes.string,
	lastMessage: PropTypes.string,
	favorite: PropTypes.bool,
	alert: PropTypes.bool,
	hideUnreadStatus: PropTypes.bool,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	roomUpdatedAt: PropTypes.instanceOf(Date),
	toggleFav: PropTypes.func,
	toggleRead: PropTypes.func,
	onPress: PropTypes.func,
	hideChannel: PropTypes.func
};

RoomItem.defaultProps = {
	avatarSize: 48,
	status: 'offline'
};

export default RoomItem;
