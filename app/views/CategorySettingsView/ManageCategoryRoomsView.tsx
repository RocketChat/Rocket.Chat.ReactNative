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
import { useCategoryDraftStore } from '~/views/CreateCategoryView/hooks/useCategoryDraftStore';
import { roomSearchHeaderOptions } from '~/views/CreateCategoryView/utils/roomSearchHeaderOptions';
import { isRoomIn } from '~/views/CreateCategoryView/utils/roomSelection';
import { useCustomCategory } from './hooks/useCustomCategory';

export type ManageCategoryRoomsViewParams = {
	categoryId: string;
	initialRoomIds: string[];
};

const ManageCategoryRoomsView = ({ route }: StaticScreenProps<ManageCategoryRoomsViewParams>) => {
	const { categoryId, initialRoomIds } = route.params;
	const { colors } = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'ManageCategoryRoomsView'>>();
	const category = useCustomCategory(categoryId);
	const [searchText, setSearchText] = useState('');
	const rooms = useCategoryRoomCandidates(searchText);
	const selectedRooms = useCategoryDraftStore(state => state.rooms);
	const toggleRoom = useCategoryDraftStore(state => state.toggleRoom);
	const isSelected = (rid: string) => isRoomIn(selectedRooms, rid);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Manage_rooms'),
			...headerRightActions([
				{
					label: I18n.t('Next'),
					testID: 'manage-category-rooms-view-next',
					onPress: () => navigation.navigate('ConfirmCategoryRoomsView', { categoryId, initialRoomIds })
				}
			]),
			...roomSearchHeaderOptions(setSearchText)
		});
	}, [navigation, categoryId, initialRoomIds]);

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
