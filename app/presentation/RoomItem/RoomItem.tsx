import React from 'react';
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
import { DisplayMode } from '../../constants/constantDisplayMode';
import { TUserStatus } from '../../definitions/UserStatus';

interface IRoomItem {
	rid: string;
	type: string;
	prid: string;
	name: string;
	avatar: string;
	showLastMessage: boolean;
	username: string;
	avatarSize: number;
	testID: string;
	width: number;
	status: TUserStatus;
	useRealName: boolean;
	theme: string;
	isFocused: boolean;
	isGroupChat: boolean;
	isRead: boolean;
	teamMain: boolean;
	date: string;
	accessibilityLabel: string;
	lastMessage: {
		u: any;
		pinned: boolean;
		t: string;
		attachments: any;
		msg: string;
		e2e: string;
	};
	favorite: boolean;
	alert: boolean;
	hideUnreadStatus: boolean;
	unread: number;
	userMentions: number;
	groupMentions: number;
	tunread: [];
	tunreadUser: [];
	tunreadGroup: [];
	swipeEnabled: boolean;
	toggleFav(): void;
	toggleRead(): void;
	onPress(): void;
	onLongPress(): void;
	hideChannel(): void;
	autoJoin: boolean;
	size?: number;
	showAvatar: boolean;
	displayMode: string;
}

const RoomItem = ({
	rid,
	type,
	prid,
	name,
	avatar,
	width,
	avatarSize = 48,
	username,
	showLastMessage,
	status = 'offline',
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
	swipeEnabled = true,
	onPress,
	onLongPress,
	toggleFav,
	toggleRead,
	hideChannel,
	teamMain,
	autoJoin,
	showAvatar,
	displayMode
}: IRoomItem) => (
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
		displayMode={displayMode}>
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
			showLastMessage={showLastMessage}>
			{showLastMessage && displayMode === DisplayMode.Expanded ? (
				<>
					<View style={styles.titleContainer}>
						{showAvatar ? (
							<TypeIcon type={type} prid={prid} status={status} isGroupChat={isGroupChat} theme={theme} teamMain={teamMain} />
						) : null}
						<Title name={name} theme={theme} hideUnreadStatus={hideUnreadStatus} alert={alert} />
						{autoJoin ? <Tag testID='auto-join-tag' name={I18n.t('Auto-join')} /> : null}
						<UpdatedAt date={date} theme={theme} hideUnreadStatus={hideUnreadStatus} alert={alert} />
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
			) : (
				<View style={[styles.titleContainer, styles.flex]}>
					<TypeIcon
						type={type}
						prid={prid}
						status={status}
						isGroupChat={isGroupChat}
						theme={theme}
						teamMain={teamMain}
						size={22}
						style={{ marginRight: 8 }}
					/>
					<Title name={name} theme={theme} hideUnreadStatus={hideUnreadStatus} alert={alert} />
					{autoJoin ? <Tag name={I18n.t('Auto-join')} /> : null}
					<View style={styles.wrapUpdatedAndBadge}>
						<UpdatedAt date={date} theme={theme} hideUnreadStatus={hideUnreadStatus} alert={alert} />
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
			)}
		</Wrapper>
	</Touchable>
);

export default RoomItem;
