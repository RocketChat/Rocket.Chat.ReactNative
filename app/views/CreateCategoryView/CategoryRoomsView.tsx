import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';

import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { headerRightActions } from '~/lib/methods/helpers/navigation/headerActions';
import { type NewMessageStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import CategoryRoomList from './components/CategoryRoomList';
import { useCategoryRoomCandidates } from './hooks/useCategoryRoomCandidates';
import { useRoomSelection } from './hooks/useRoomSelection';
import { roomSearchHeaderOptions } from './utils/roomSearchHeaderOptions';

export type CategoryRoomsViewParams = {
	name: string;
};

const CategoryRoomsView = ({ route }: StaticScreenProps<CategoryRoomsViewParams>) => {
	const { name } = route.params;
	const { colors } = useTheme();
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
			...roomSearchHeaderOptions(setSearchText)
		});
	}, [navigation, name, selectedRooms]);

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
