import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';

import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { headerRightActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type NewMessageStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import CategoryRoomList from './components/CategoryRoomList';
import { useCategoryDraftStore } from './hooks/useCategoryDraftStore';
import { useCategoryRoomCandidates } from './hooks/useCategoryRoomCandidates';
import { roomSearchHeaderOptions } from './utils/roomSearchHeaderOptions';
import { isRoomIn } from './utils/roomSelection';

export type CategoryRoomsViewParams = undefined;

const CategoryRoomsView = () => {
	const { colors } = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'CategoryRoomsView'>>();
	const [searchText, setSearchText] = useState('');
	const rooms = useCategoryRoomCandidates(searchText);
	const selectedRooms = useCategoryDraftStore(state => state.rooms);
	const toggleRoom = useCategoryDraftStore(state => state.toggleRoom);
	const isSelected = (rid: string) => isRoomIn(selectedRooms, rid);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Add_rooms'),
			...headerRightActions([
				{
					label: I18n.t('Next'),
					testID: 'category-rooms-view-next',
					onPress: () => navigation.navigate('ConfirmCategoryView')
				}
			]),
			...roomSearchHeaderOptions(setSearchText)
		});
	}, [navigation]);

	return (
		<SafeAreaView testID='category-rooms-view' style={{ backgroundColor: colors.surfaceTint }}>
			<CategoryRoomList
				rooms={rooms}
				selectedRooms={selectedRooms}
				isSelected={isSelected}
				onToggle={toggleRoom}
				onSearch={setSearchText}
			/>
		</SafeAreaView>
	);
};

export default CategoryRoomsView;
