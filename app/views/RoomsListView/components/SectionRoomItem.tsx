import { memo } from 'react';
import Animated, { type EntryExitAnimationFunction } from 'react-native-reanimated';

import RoomItem from '~/containers/RoomItem';
import { type IRoomItemContainerProps } from '~/containers/RoomItem/interfaces';

interface ISectionRoomItem extends IRoomItemContainerProps {
	entering: EntryExitAnimationFunction;
	exiting: EntryExitAnimationFunction;
}

const SectionRoomItem = ({
	entering,
	exiting,
	item,
	id,
	username,
	showLastMessage,
	onPress,
	width,
	useRealName,
	getRoomTitle,
	getRoomAvatar,
	getIsRead,
	isFocused,
	swipeEnabled,
	showAvatar,
	displayMode
}: ISectionRoomItem) => (
	<Animated.View entering={entering} exiting={exiting}>
		<RoomItem
			item={item}
			id={id}
			username={username}
			showLastMessage={showLastMessage}
			onPress={onPress}
			width={width}
			useRealName={useRealName}
			getRoomTitle={getRoomTitle}
			getRoomAvatar={getRoomAvatar}
			getIsRead={getIsRead}
			isFocused={isFocused}
			swipeEnabled={swipeEnabled}
			showAvatar={showAvatar}
			displayMode={displayMode}
		/>
	</Animated.View>
);

export default memo(SectionRoomItem);
