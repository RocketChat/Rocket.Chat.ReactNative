import { memo, useEffect, useReducer } from 'react';
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
		'use no memo';
		const [, forceUpdate] = useReducer((version: number) => version + 1, 0);
		useEffect(() => {
			const subscription = item.observe?.().subscribe(forceUpdate);
			return () => subscription?.unsubscribe();
		}, [item]);
		const { showActionSheet } = useActionSheet();
		const serverVersion = useAppSelector(state => state.server.version);
		const name = getRoomTitle(item);
		const testID = `rooms-list-view-item-${name}`;
		const avatar = getRoomAvatar(item);
		const isRead = getIsRead(item);
		const isInvited = isInviteSubscription(item);
		const date = item.roomUpdatedAt && formatDate(item.roomUpdatedAt);
		const alert = item.alert || item.tunread?.length;
		const userId = item.t === 'd' && id && !isGroupChat(item) ? id : null;
		const accessibilityDate = formatDateAccessibility(item.roomUpdatedAt);

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
					rid: item.rid,
					type: item.t,
					isRead,
					favorite: !!item.f,
					serverVersion
				})
			});
		};

		return (
			<RoomItem
				name={name}
				avatar={avatar}
				isGroupChat={isGroupChat(item)}
				isInvited={isInvited}
				isRead={isRead}
				onPress={handleOnPress}
				onLongPress={handleOnLongPress}
				date={date}
				accessibilityDate={accessibilityDate}
				width={width}
				favorite={item.f}
				rid={item.rid}
				userId={userId}
				testID={testID}
				type={item.t}
				isFocused={isFocused}
				prid={item.prid}
				hideUnreadStatus={item.hideUnreadStatus}
				hideMentionStatus={item.hideMentionStatus}
				alert={alert}
				lastMessage={item.lastMessage}
				showLastMessage={showLastMessage}
				username={username}
				useRealName={useRealName}
				unread={item.unread}
				userMentions={item.userMentions}
				groupMentions={item.groupMentions}
				tunread={item.tunread}
				tunreadUser={item.tunreadUser}
				tunreadGroup={item.tunreadGroup}
				swipeEnabled={swipeEnabled}
				teamMain={item.teamMain}
				autoJoin={autoJoin}
				showAvatar={showAvatar}
				displayMode={displayMode}
				status={item.t === 'l' ? item?.visitor?.status : null}
				sourceType={item.t === 'l' ? item.source : null}
				abacAttributes={item.abacAttributes}
			/>
		);
	}
);

export default RoomItemContainer;
