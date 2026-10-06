import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '~/containers/List';
import RowSeparator from '~/containers/NativeListRow/components/Separator';
import { hasNativeHeaderBar, isIOS26OrLater } from '~/lib/methods/helpers';
import { type ICategoryRoom } from '../types';
import NativeRoomCheckItem from './NativeRoomCheckItem';
import RoomCheckItem from './RoomCheckItem';
import SelectedRoomsHeader from './SelectedRoomsHeader';

interface ICategoryRoomList {
	rooms: ICategoryRoom[];
	selectedRooms: ICategoryRoom[];
	isSelected: (rid: string) => boolean;
	onToggle: (room: ICategoryRoom) => void;
	onSearch: (text: string) => void;
	categoryName?: string;
}

const CategoryRoomList = ({ rooms, selectedRooms, isSelected, onToggle, onSearch, categoryName }: ICategoryRoomList) => {
	const { bottom } = useSafeAreaInsets();

	return (
		<FlatList
			data={rooms}
			keyExtractor={room => room.rid}
			renderItem={({ item, index }) =>
				isIOS26OrLater ? (
					<NativeRoomCheckItem
						room={item}
						isSelected={isSelected(item.rid)}
						onToggle={onToggle}
						isFirst={index === 0}
						isLast={index === rooms.length - 1}
					/>
				) : (
					<RoomCheckItem room={item} isSelected={isSelected(item.rid)} onToggle={onToggle} />
				)
			}
			ItemSeparatorComponent={isIOS26OrLater ? RowSeparator : List.Separator}
			ListHeaderComponent={
				<SelectedRoomsHeader selectedRooms={selectedRooms} onSearch={onSearch} onRemove={onToggle} categoryName={categoryName} />
			}
			contentInsetAdjustmentBehavior={hasNativeHeaderBar ? 'automatic' : undefined}
			contentContainerStyle={{ paddingTop: 16, paddingBottom: bottom }}
			keyboardShouldPersistTaps='always'
			keyboardDismissMode='on-drag'
		/>
	);
};

export default CategoryRoomList;
