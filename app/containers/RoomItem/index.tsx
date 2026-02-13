import React, { useEffect, useReducer, useRef } from 'react';
import { type Subscription } from 'rxjs';
import { AccessibilityInfo } from 'react-native';

import { useActionSheet } from '../ActionSheet';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { isGroupChat } from '../../lib/methods/helpers';
import { formatDate, formatDateAccessibility } from '../../lib/methods/helpers/room';
import { type IRoomItemContainerProps } from './interfaces';
import RoomItem from './RoomItem';
import { getRoomActionsOptions } from './getRoomActionsOptions';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';

const attrs = ['width', 'isFocused', 'showLastMessage', 'autoJoin', 'showAvatar', 'displayMode'];

const RoomItemContainer = React.memo(
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
		const { showActionSheet } = useActionSheet();
		const serverVersion = useAppSelector(state => state.server.version);
		const name = getRoomTitle(item);
		const testID = `rooms-list-view-item-${name}`;
		const avatar = getRoomAvatar(item);
		const isRead = getIsRead(item);
		const date = item.roomUpdatedAt && formatDate(item.roomUpdatedAt);
		const alert = item.alert || item.tunread?.length;
		const [_, forceUpdate] = useReducer(x => x + 1, 1);
		const roomSubscription = useRef<Subscription | null>(null);
		const userId = item.t === 'd' && id && !isGroupChat(item) ? id : null;
		const accessibilityDate = formatDateAccessibility(item.roomUpdatedAt);

		useEffect(() => {
			const init = () => {
				if (item?.observe) {
					const observable = item.observe();
					roomSubscription.current = observable?.subscribe?.(() => {
						if (_) forceUpdate();
					});
				}
			};
			init();

			return () => roomSubscription.current?.unsubscribe();
		}, []);

		const handleOnPress = () => onPress(item);

		const handleOnLongPress = async () => {
			if (onLongPress) {
				onLongPress(item);
				return;
			}
			const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
			if (item.separator || !isScreenReaderEnabled) {
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
				isInvited={isInviteSubscription(item)}
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
	},
	(props, nextProps) => attrs.every(key => props[key] === nextProps[key])
);

export default RoomItemContainer;
