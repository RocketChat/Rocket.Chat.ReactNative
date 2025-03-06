import React, { useEffect, useReducer, useRef } from 'react';
import { Subscription } from 'rxjs';

import { isGroupChat } from '../../lib/methods/helpers';
import { formatDate } from '../../lib/methods/helpers/room';
import { IRoomItemContainerProps } from './interfaces';
import RoomItem from './RoomItem';
import { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } from './styles';

export { ROW_HEIGHT, ROW_HEIGHT_CONDENSED };

const attrs = ['width', 'isFocused', 'showLastMessage', 'autoJoin', 'showAvatar', 'displayMode'];

const RoomItemContainer = React.memo(
	({
		item,
		id,
		onPress,
		onLongPress,
		width,
		toggleFav,
		toggleRead,
		hideChannel,
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
		const name = getRoomTitle(item);
		const testID = `rooms-list-view-item-${name}`;
		const avatar = getRoomAvatar(item);
		const isRead = getIsRead(item);
		const date = item.roomUpdatedAt && formatDate(item.roomUpdatedAt);
		const alert = item.alert || item.tunread?.length;
		const [_, forceUpdate] = useReducer(x => x + 1, 1);
		const roomSubscription = useRef<Subscription | null>(null);
		const userId = item.t === 'd' && id && !isGroupChat(item) ? id : null;

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

		const handleOnLongPress = () => onLongPress && onLongPress(item);

		return (
			<RoomItem
				name={name}
				avatar={avatar}
				isGroupChat={isGroupChat(item)}
				isRead={isRead}
				onPress={handleOnPress}
				onLongPress={handleOnLongPress}
				date={date}
				width={width}
				favorite={item.f}
				rid={item.rid}
				userId={userId}
				toggleFav={toggleFav}
				toggleRead={toggleRead}
				hideChannel={hideChannel}
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
			/>
		);
	},
	(props, nextProps) => attrs.every(key => props[key] === nextProps[key])
);

export default RoomItemContainer;
