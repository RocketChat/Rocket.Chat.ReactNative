import { memo } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useActionSheet } from '../ActionSheet';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { isGroupChat } from '~/lib/methods/helpers';
import { formatDate, formatDateAccessibility } from '~/lib/methods/helpers/room';
import { type IRoomItemContainerProps } from './interfaces';
import RoomItem from './RoomItem';
import { getRoomActionsOptions } from './getRoomActionsOptions';
import { isInviteSubscription } from '~/lib/methods/isInviteSubscription';
import { isExternalKeyboardConnected } from '~/lib/methods/helpers/externalInput';
import { useRoomSnapshot } from './useRoomSnapshot';

const RoomItemContainer = memo(
	({
		item,
		id,
		onPress,
		onLongPress,
		width,
		isFocused,
		showLastMessage,
		username,
		useRealName,
		autoJoin,
		showAvatar,
		displayMode,
		getRoomTitle = () => 'title',
		getRoomAvatar = () => '',
		getIsRead = () => false,
		swipeEnabled = true
	}: IRoomItemContainerProps) => {
		const room = useRoomSnapshot(item);
		const { showActionSheet } = useActionSheet();
		const serverVersion = useAppSelector(state => state.server.version);
		const name = getRoomTitle(room);
		const testID = `rooms-list-view-item-${name}`;
		const avatar = getRoomAvatar(room);
		const isRead = getIsRead(room);
		const isInvited = isInviteSubscription(room);
		const date = room.roomUpdatedAt && formatDate(room.roomUpdatedAt);
		const alert = room.alert || room.tunread?.length;
		const userId = room.t === 'd' && id && !isGroupChat(room) ? id : null;
		const accessibilityDate = formatDateAccessibility(room.roomUpdatedAt);

		const handleOnPress = () => onPress(item);

		const handleOnLongPress = async () => {
			if (onLongPress) {
				onLongPress(item);
				return;
			}
			const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
			const hasExternalKeyboard = isExternalKeyboardConnected();

			if (item.separator || !swipeEnabled || (!isScreenReaderEnabled && !hasExternalKeyboard)) {
				return;
			}
			showActionSheet({
				options: getRoomActionsOptions({
					rid: room.rid,
					type: room.t,
					isRead,
					favorite: !!room.f,
					serverVersion
				})
			});
		};

		return (
			<RoomItem
				name={name}
				avatar={avatar}
				isGroupChat={isGroupChat(room)}
				isInvited={isInvited}
				isRead={isRead}
				onPress={handleOnPress}
				onLongPress={handleOnLongPress}
				date={date}
				accessibilityDate={accessibilityDate}
				width={width}
				favorite={room.f}
				rid={room.rid}
				userId={userId}
				testID={testID}
				type={room.t}
				isFocused={isFocused}
				prid={room.prid}
				hideUnreadStatus={room.hideUnreadStatus}
				hideMentionStatus={room.hideMentionStatus}
				alert={alert}
				lastMessage={room.lastMessage}
				showLastMessage={showLastMessage}
				username={username}
				useRealName={useRealName}
				unread={room.unread}
				userMentions={room.userMentions}
				groupMentions={room.groupMentions}
				tunread={room.tunread}
				tunreadUser={room.tunreadUser}
				tunreadGroup={room.tunreadGroup}
				swipeEnabled={swipeEnabled}
				teamMain={room.teamMain}
				autoJoin={autoJoin}
				showAvatar={showAvatar}
				displayMode={displayMode}
				status={room.t === 'l' ? room?.visitor?.status : null}
				sourceType={room.t === 'l' ? room.source : null}
				abacAttributes={room.abacAttributes}
			/>
		);
	}
);

export default RoomItemContainer;
