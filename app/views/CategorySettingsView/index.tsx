import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';

import * as List from '~/containers/List';
import { ICON_SIZE } from '~/containers/List/constants';
import Radio from '~/containers/Radio';
import SafeAreaView from '~/containers/SafeAreaView';
import Switch from '~/containers/Switch';
import { type ISidebarCategory } from '~/definitions';
import { DisplayMode, SortBy } from '~/lib/constants/constantDisplayMode';
import { type ChatsStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import { useCategoryUnreadToggles } from './hooks/useCategoryUnreadToggles';
import { useCustomCategory } from './hooks/useCustomCategory';
import { useDeleteCategory } from './hooks/useDeleteCategory';
import { useDisplayShortcuts } from './hooks/useDisplayShortcuts';
import { useRoomsInCategory } from './hooks/useRoomsInCategory';

export type CategorySettingsViewParams = {
	categoryId: string;
};

const renderRadio = (checked: boolean) => <Radio check={checked} size={ICON_SIZE} />;

const CategorySettings = ({ category }: { category: ISidebarCategory }) => {
	const { colors } = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'CategorySettingsView'>>();
	const rooms = useRoomsInCategory(category._id);
	const unread = useCategoryUnreadToggles(category);
	const display = useDisplayShortcuts();
	const confirmDelete = useDeleteCategory(
		category,
		rooms.map(room => room.rid)
	);

	useLayoutEffect(() => {
		navigation.setOptions({ title: category.name });
	}, [navigation, category.name]);

	return (
		<List.Container testID='category-settings-view-list'>
			<List.Section>
				<List.Separator />
				<List.Item
					title='Manage_rooms'
					testID='category-settings-view-manage-rooms'
					left={() => <List.Icon name='settings' />}
					onPress={() => navigation.navigate('ManageCategoryRoomsView', { categoryId: category._id, rooms })}
					showActionIndicator
				/>
				<List.Separator />
				<List.Item
					title='Rename'
					testID='category-settings-view-rename'
					left={() => <List.Icon name='edit' />}
					onPress={() => navigation.navigate('RenameCategoryView', { categoryId: category._id })}
					showActionIndicator
				/>
				<List.Separator />
			</List.Section>
			<List.Section title='Unread_rooms_on_main_display'>
				<List.Separator />
				<List.Item
					title='Always_display'
					testID='category-settings-view-always-display'
					left={() => <List.Icon name='flag' />}
					right={() => (
						<Switch
							accessible={false}
							value={unread.showUnreads}
							onValueChange={unread.toggleShowUnreads}
							disabled={unread.disabled}
						/>
					)}
					onPress={unread.toggleShowUnreads}
					disabled={unread.disabled}
					additionalAccessibilityLabel={unread.showUnreads}
					accessibilityRole='switch'
				/>
				<List.Separator />
				<List.Item
					title='Keep_on_top'
					testID='category-settings-view-keep-on-top'
					left={() => <List.Icon name='sort' />}
					right={() => (
						<Switch
							accessible={false}
							value={unread.keepUnreadsOnTop}
							onValueChange={unread.toggleKeepUnreadsOnTop}
							disabled={unread.disabled}
						/>
					)}
					onPress={unread.toggleKeepUnreadsOnTop}
					disabled={unread.disabled}
					additionalAccessibilityLabel={unread.keepUnreadsOnTop}
					accessibilityRole='switch'
				/>
				<List.Separator />
			</List.Section>
			<List.Section title='Display'>
				<List.Separator />
				<List.Item
					title='Expanded'
					testID='category-settings-view-expanded'
					left={() => <List.Icon name='view-extended' />}
					right={() => renderRadio(display.displayMode === DisplayMode.Expanded)}
					onPress={() => display.setDisplayMode(DisplayMode.Expanded)}
					additionalAccessibilityLabel={display.displayMode === DisplayMode.Expanded}
					accessibilityRole='radio'
				/>
				<List.Separator />
				<List.Item
					title='Condensed'
					testID='category-settings-view-condensed'
					left={() => <List.Icon name='view-medium' />}
					right={() => renderRadio(display.displayMode === DisplayMode.Condensed)}
					onPress={() => display.setDisplayMode(DisplayMode.Condensed)}
					additionalAccessibilityLabel={display.displayMode === DisplayMode.Condensed}
					accessibilityRole='radio'
				/>
				<List.Separator />
				<List.Item
					title='Avatars'
					testID='category-settings-view-avatars'
					left={() => <List.Icon name='avatar' />}
					right={() => <Switch accessible={false} value={display.showAvatar} onValueChange={display.toggleAvatar} />}
					onPress={display.toggleAvatar}
					additionalAccessibilityLabel={display.showAvatar}
					accessibilityRole='switch'
				/>
				<List.Separator />
			</List.Section>
			<List.Section title='Sort_by'>
				<List.Separator />
				<List.Item
					title='Activity'
					testID='category-settings-view-activity'
					left={() => <List.Icon name='clock' />}
					right={() => renderRadio(display.sortBy === SortBy.Activity)}
					onPress={() => display.setSortBy(SortBy.Activity)}
					additionalAccessibilityLabel={display.sortBy === SortBy.Activity}
					accessibilityRole='radio'
				/>
				<List.Separator />
				<List.Item
					title='Name'
					testID='category-settings-view-name'
					left={() => <List.Icon name='sort-az' />}
					right={() => renderRadio(display.sortBy === SortBy.Alphabetical)}
					onPress={() => display.setSortBy(SortBy.Alphabetical)}
					additionalAccessibilityLabel={display.sortBy === SortBy.Alphabetical}
					accessibilityRole='radio'
				/>
				<List.Separator />
			</List.Section>
			<List.Section>
				<List.Separator />
				<List.Item
					title='Delete'
					testID='category-settings-view-delete'
					color={colors.fontDanger}
					left={() => <List.Icon name='delete' color={colors.fontDanger} />}
					onPress={confirmDelete}
				/>
				<List.Separator />
			</List.Section>
		</List.Container>
	);
};

const CategorySettingsView = ({ route }: StaticScreenProps<CategorySettingsViewParams>) => {
	const category = useCustomCategory(route.params.categoryId);

	return (
		<SafeAreaView testID='category-settings-view'>{category ? <CategorySettings category={category} /> : null}</SafeAreaView>
	);
};

export default CategorySettingsView;
