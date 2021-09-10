import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import styles from './styles';
import Wrapper from './Wrapper';
import UnreadBadge from '../UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';
import Title from './Title';
import UpdatedAt from './UpdatedAt';
import Touchable from './Touchable';
import Tag from './Tag';
import I18n from '../../i18n';
import { DISPLAY_MODE_EXPANDED } from '../../constants/constantDisplayMode';

const RoomItem = ({
	rid,
	type,
	prid,
	name,
	avatar,
	width,
	avatarSize,
	username,
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
	tunread,
	tunreadUser,
	tunreadGroup,
	testID,
	swipeEnabled,
	onPress,
	onLongPress,
	toggleFav,
	toggleRead,
	hideChannel,
	teamMain,
	autoJoin,
	showAvatar,
	displayMode
}) => (
	<Touchable
		onPress={onPress}
		onLongPress={onLongPress}
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
		swipeEnabled={swipeEnabled}
		displayMode={displayMode}
	>
		<Wrapper
			accessibilityLabel={accessibilityLabel}
			avatar={avatar}
			avatarSize={avatarSize}
			type={type}
			theme={theme}
			rid={rid}
			prid={prid}
			status={status}
			isGroupChat={isGroupChat}
			teamMain={teamMain}
			displayMode={displayMode}
			showAvatar={showAvatar}
			showLastMessage={showLastMessage}
		>
			{showLastMessage && displayMode === DISPLAY_MODE_EXPANDED
				? (
					<>
						<View style={styles.titleContainer}>
							{ showAvatar
								? (
									<TypeIcon
										type={type}
										prid={prid}
										status={status}
										isGroupChat={isGroupChat}
										theme={theme}
										teamMain={teamMain}
									/>
								) : null }
							<Title
								name={name}
								theme={theme}
								hideUnreadStatus={hideUnreadStatus}
								alert={alert}
							/>
							{
								autoJoin ? <Tag testID='auto-join-tag' name={I18n.t('Auto-join')} /> : null
							}
							<UpdatedAt
								date={date}
								theme={theme}
								hideUnreadStatus={hideUnreadStatus}
								alert={alert}
							/>
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
								tunread={tunread}
								tunreadUser={tunreadUser}
								tunreadGroup={tunreadGroup}
							/>
						</View>
					</>
				)
				: (
					<View style={[styles.titleContainer, styles.flex]}>
						<TypeIcon
							type={type}
							prid={prid}
							status={status}
							isGroupChat={isGroupChat}
							theme={theme}
							teamMain={teamMain}
							size={18}
						/>
						<Title
							name={name}
							theme={theme}
							hideUnreadStatus={hideUnreadStatus}
							alert={alert}
						/>
						{
							autoJoin ? <Tag name={I18n.t('Auto-join')} /> : null
						}
						<View style={styles.wrapUpdatedAndBadge}>
							<UpdatedAt
								date={date}
								theme={theme}
								hideUnreadStatus={hideUnreadStatus}
								alert={alert}
							/>
							<UnreadBadge
								unread={unread}
								userMentions={userMentions}
								groupMentions={groupMentions}
								tunread={tunread}
								tunreadUser={tunreadUser}
								tunreadGroup={tunreadGroup}
							/>
						</View>
					</View>
				)
			}
		</Wrapper>
	</Touchable>
);

RoomItem.propTypes = {
	rid: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	prid: PropTypes.string,
	name: PropTypes.string.isRequired,
	avatar: PropTypes.string.isRequired,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string,
	avatarSize: PropTypes.number,
	testID: PropTypes.string,
	width: PropTypes.number,
	status: PropTypes.string,
	useRealName: PropTypes.bool,
	theme: PropTypes.string,
	isFocused: PropTypes.bool,
	isGroupChat: PropTypes.bool,
	isRead: PropTypes.bool,
	teamMain: PropTypes.bool,
	date: PropTypes.string,
	accessibilityLabel: PropTypes.string,
	lastMessage: PropTypes.object,
	favorite: PropTypes.bool,
	alert: PropTypes.bool,
	hideUnreadStatus: PropTypes.bool,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	tunread: PropTypes.array,
	tunreadUser: PropTypes.array,
	tunreadGroup: PropTypes.array,
	swipeEnabled: PropTypes.bool,
	toggleFav: PropTypes.func,
	toggleRead: PropTypes.func,
	onPress: PropTypes.func,
	onLongPress: PropTypes.func,
	hideChannel: PropTypes.func,
	autoJoin: PropTypes.bool,
	showAvatar: PropTypes.bool,
	displayMode: PropTypes.string
};

RoomItem.defaultProps = {
	avatarSize: 48,
	status: 'offline',
	swipeEnabled: true
};

export default RoomItem;
