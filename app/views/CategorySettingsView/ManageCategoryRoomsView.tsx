import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';

import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { headerRightActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type ChatsStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import CategoryRoomList from '~/views/CreateCategoryView/components/CategoryRoomList';
import { useCategoryRoomCandidates } from '~/views/CreateCategoryView/hooks/useCategoryRoomCandidates';
import { useRoomSelection } from '~/views/CreateCategoryView/hooks/useRoomSelection';
import { roomSearchHeaderOptions } from '~/views/CreateCategoryView/utils/roomSearchHeaderOptions';
import { type ICategoryRoom } from '~/views/CreateCategoryView/types';
import { useCustomCategory } from './hooks/useCustomCategory';

export type ManageCategoryRoomsViewParams = {
	categoryId: string;
	rooms: ICategoryRoom[];
};

const ManageCategoryRoomsView = ({ route }: StaticScreenProps<ManageCategoryRoomsViewParams>) => {
	const { categoryId, rooms: initialRooms } = route.params;
	const { colors } = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'ManageCategoryRoomsView'>>();
	const category = useCustomCategory(categoryId);
	const [searchText, setSearchText] = useState('');
	const rooms = useCategoryRoomCandidates(searchText);
	const { selectedRooms, isSelected, toggleRoom } = useRoomSelection(initialRooms);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Manage_rooms'),
			...headerRightActions([
				{
					label: I18n.t('Next'),
					testID: 'manage-category-rooms-view-next',
					onPress: () =>
						navigation.navigate('ConfirmCategoryRoomsView', {
							categoryId,
							initialRoomIds: initialRooms.map(room => room.rid),
							rooms: selectedRooms
						})
				}
			]),
			...roomSearchHeaderOptions(setSearchText)
		});
	}, [navigation, categoryId, initialRooms, selectedRooms]);

	return (
		<SafeAreaView testID='manage-category-rooms-view' style={{ backgroundColor: colors.surfaceTint }}>
			<CategoryRoomList
				rooms={rooms}
				selectedRooms={selectedRooms}
				isSelected={isSelected}
				onToggle={toggleRoom}
				onSearch={setSearchText}
				categoryName={category?.name}
			/>
		</SafeAreaView>
	);
};

export default ManageCategoryRoomsView;
