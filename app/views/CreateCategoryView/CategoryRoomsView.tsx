import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '~/containers/List';
import RowSeparator from '~/containers/NativeListRow/components/Separator';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { hasNativeHeaderBar, isIOS26OrLater } from '~/lib/methods/helpers';
import { stackedSearchBarOptions } from '~/lib/methods/helpers/navigation';
import { headerRightActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type NewMessageStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import NativeRoomCheckItem from './components/NativeRoomCheckItem';
import RoomCheckItem from './components/RoomCheckItem';
import SelectedRoomsHeader from './components/SelectedRoomsHeader';
import { useCategoryRoomCandidates } from './hooks/useCategoryRoomCandidates';
import { useRoomSelection } from './hooks/useRoomSelection';

export type CategoryRoomsViewParams = {
	name: string;
};

const CategoryRoomsView = ({ route }: StaticScreenProps<CategoryRoomsViewParams>) => {
	const { name } = route.params;
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'CategoryRoomsView'>>();
	const [searchText, setSearchText] = useState('');
	const rooms = useCategoryRoomCandidates(searchText);
	const { selectedRooms, isSelected, toggleRoom } = useRoomSelection();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Add_rooms'),
			...headerRightActions([
				{
					label: I18n.t('Next'),
					testID: 'category-rooms-view-next',
					onPress: () => navigation.navigate('ConfirmCategoryView', { name, rooms: selectedRooms })
				}
			]),
			...(hasNativeHeaderBar
				? {
						headerTransparent: true,
						headerSearchBarOptions: stackedSearchBarOptions({ onChangeText: setSearchText, placeholder: I18n.t('Search_rooms') })
					}
				: {})
		});
	}, [navigation, name, selectedRooms]);

	return (
		<SafeAreaView testID='category-rooms-view' style={{ backgroundColor: colors.surfaceTint }}>
			<FlatList
				data={rooms}
				keyExtractor={room => room.rid}
				renderItem={({ item, index }) =>
					isIOS26OrLater ? (
						<NativeRoomCheckItem
							room={item}
							isSelected={isSelected(item.rid)}
							onToggle={toggleRoom}
							isFirst={index === 0}
							isLast={index === rooms.length - 1}
						/>
					) : (
						<RoomCheckItem room={item} isSelected={isSelected(item.rid)} onToggle={toggleRoom} />
					)
				}
				ItemSeparatorComponent={isIOS26OrLater ? RowSeparator : List.Separator}
				ListHeaderComponent={<SelectedRoomsHeader selectedRooms={selectedRooms} onSearch={setSearchText} onRemove={toggleRoom} />}
				contentInsetAdjustmentBehavior={hasNativeHeaderBar ? 'automatic' : undefined}
				contentContainerStyle={{ paddingTop: 16, paddingBottom: bottom }}
				keyboardShouldPersistTaps='always'
				keyboardDismissMode='on-drag'
			/>
		</SafeAreaView>
	);
};

export default CategoryRoomsView;
