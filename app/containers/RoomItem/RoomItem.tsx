import React, { useMemo } from 'react';
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
import { DisplayMode } from '../../lib/constants';
import { IRoomItemProps } from './interfaces';
import { formatLastMessage } from '../../lib/methods/formatLastMessage';
import { capitalize } from '../../lib/methods/helpers';

const RoomItem = ({
	rid,
	userId,
	type,
	prid,
	name,
	avatar,
	width,
	username,
	showLastMessage,
	status = 'offline',
	useRealName,
	isFocused,
	isGroupChat,
	isRead,
	date,
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
	swipeEnabled = true,
	onPress,
	onLongPress,
	toggleFav,
	toggleRead,
	hideChannel,
	teamMain,
	autoJoin,
	showAvatar,
	displayMode,
	sourceType,
	hideMentionStatus
}: IRoomItemProps) => {
	const memoizedMessage = useMemo(
		() => formatLastMessage({ lastMessage, username, useRealName, showLastMessage, alert, type }),
		[lastMessage, username, useRealName, showLastMessage, alert, type]
	);
	const accessibilityLabel = useMemo(() => `${name} ${capitalize(date)} ${memoizedMessage}`, [name, date, memoizedMessage]);
	return (
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
			isFocused={!!isFocused}
			swipeEnabled={swipeEnabled}
			displayMode={displayMode}>
			<Wrapper
				accessibilityLabel={accessibilityLabel}
				avatar={avatar}
				type={type}
				userId={userId}
				rid={rid}
				prid={prid}
				status={status}
				isGroupChat={isGroupChat}
				teamMain={teamMain}
				displayMode={displayMode}
				showAvatar={showAvatar}
				showLastMessage={!!showLastMessage}
				sourceType={sourceType}>
				{showLastMessage && displayMode === DisplayMode.Expanded ? (
					<>
						<View style={styles.titleContainer}>
							{showAvatar ? (
								<TypeIcon
									userId={userId}
									type={type}
									prid={prid}
									status={status}
									isGroupChat={isGroupChat}
									teamMain={teamMain}
									sourceType={sourceType}
								/>
							) : null}
							<Title name={name} hideUnreadStatus={hideUnreadStatus} alert={alert} />
							{autoJoin ? <Tag testID='auto-join-tag' name={I18n.t('Auto-join')} /> : null}
							<UpdatedAt date={date} hideUnreadStatus={hideUnreadStatus} alert={alert} />
						</View>
						<View style={styles.row} testID='room-item-last-message-container'>
							<LastMessage
								lastMessage={lastMessage}
								type={type}
								showLastMessage={showLastMessage}
								username={username || ''}
								alert={alert && !hideUnreadStatus}
								useRealName={useRealName}
							/>
							<UnreadBadge
								unread={unread}
								userMentions={userMentions}
								groupMentions={groupMentions}
								tunread={tunread}
								tunreadUser={tunreadUser}
								tunreadGroup={tunreadGroup}
								hideMentionStatus={hideMentionStatus}
								hideUnreadStatus={hideUnreadStatus}
							/>
						</View>
					</>
				) : (
					<View style={[styles.titleContainer, styles.flex]}>
						<TypeIcon
							userId={userId}
							type={type}
							prid={prid}
							status={status}
							isGroupChat={isGroupChat}
							teamMain={teamMain}
							size={22}
							style={{ marginRight: 8 }}
							sourceType={sourceType}
						/>
						<Title name={name} hideUnreadStatus={hideUnreadStatus} alert={alert} />
						{autoJoin ? <Tag name={I18n.t('Auto-join')} /> : null}
						<View style={styles.wrapUpdatedAndBadge}>
							<UpdatedAt date={date} hideUnreadStatus={hideUnreadStatus} alert={alert} />
							<UnreadBadge
								unread={unread}
								userMentions={userMentions}
								groupMentions={groupMentions}
								tunread={tunread}
								tunreadUser={tunreadUser}
								tunreadGroup={tunreadGroup}
								hideMentionStatus={hideMentionStatus}
								hideUnreadStatus={hideUnreadStatus}
							/>
						</View>
					</View>
				)}
			</Wrapper>
		</Touchable>
	);
};

export default RoomItem;
