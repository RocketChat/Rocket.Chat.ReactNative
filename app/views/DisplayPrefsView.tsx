import React, { useLayoutEffect } from 'react';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import Switch from '../containers/Switch';
import { setPreference } from '../actions/sortPreferences';
import { DisplayMode, SortBy } from '../lib/constants/constantDisplayMode';
import * as List from '../containers/List';
import { ICON_SIZE } from '../containers/List/constants';
import SafeAreaView from '../containers/SafeAreaView';
import Radio from '../containers/Radio';
import { type IPreferences } from '../definitions';
import I18n from '../i18n';
import { type SettingsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { events, logEvent } from '../lib/methods/helpers/log';
import { isIOS } from '../lib/methods/helpers';
import { saveSortPreference } from '../lib/methods/userPreferencesMethods';
import { useAppSelector } from '../lib/hooks/useAppSelector';

const DisplayPrefsView = (): React.ReactElement => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'DisplayPrefsView'>>();
	const { colors } = useTheme();

	const { sortBy, groupByType, showFavorites, showUnread, showAvatar, displayMode } = useAppSelector(
		state => state.sortPreferences
	);
	const dispatch = useDispatch();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Display')
		});
	}, []);

	const setSortPreference = (param: Partial<IPreferences>) => {
		dispatch(setPreference(param));
		saveSortPreference(param);
	};

	const sortByName = () => {
		logEvent(events.DP_SORT_CHANNELS_BY_NAME);
		setSortPreference({ sortBy: SortBy.Alphabetical });
	};

	const sortByActivity = () => {
		logEvent(events.DP_SORT_CHANNELS_BY_ACTIVITY);
		setSortPreference({ sortBy: SortBy.Activity });
	};

	const toggleGroupByType = () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_TYPE);
		setSortPreference({ groupByType: !groupByType });
	};

	const toggleGroupByFavorites = () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_FAVORITE);
		setSortPreference({ showFavorites: !showFavorites });
	};

	const toggleUnread = () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_UNREAD);
		setSortPreference({ showUnread: !showUnread });
	};

	const toggleAvatar = () => {
		logEvent(events.DP_TOGGLE_AVATAR);
		setSortPreference({ showAvatar: !showAvatar });
	};

	const displayExpanded = () => {
		logEvent(events.DP_DISPLAY_EXPANDED);
		setSortPreference({ displayMode: DisplayMode.Expanded });
	};

	const displayCondensed = () => {
		logEvent(events.DP_DISPLAY_CONDENSED);
		setSortPreference({ displayMode: DisplayMode.Condensed });
	};

	const renderCheckBox = (value: boolean) => (
		<List.Icon name={value ? 'checkbox-checked' : 'checkbox-unchecked'} color={value ? colors.strokeHighlight : ''} />
	);

	const renderAvatarSwitch = (value: boolean) => (
		<Switch accessible={false} value={value} onValueChange={() => toggleAvatar()} testID='display-pref-view-avatar-switch' />
	);

	const renderRadio = (value: boolean) => <Radio check={value} size={ICON_SIZE} />;

	return (
		<SafeAreaView>
			<List.Container testID='display-view-list'>
				<List.Section title='Display'>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-extended' />}
						title='Expanded'
						testID='display-pref-view-expanded'
						right={() => renderRadio(displayMode === DisplayMode.Expanded)}
						onPress={displayExpanded}
						additionalAccessibilityLabel={displayMode === DisplayMode.Expanded}
						accessibilityRole='radio'
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						testID='display-pref-view-condensed'
						right={() => renderRadio(displayMode === DisplayMode.Condensed)}
						onPress={displayCondensed}
						additionalAccessibilityLabel={displayMode === DisplayMode.Condensed}
						accessibilityRole='radio'
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						testID='display-pref-view-avatars'
						right={() => renderAvatarSwitch(showAvatar)}
						additionalAccessibilityLabel={showAvatar}
						accessibilityRole={isIOS ? 'switch' : 'none'}
					/>
					<List.Separator />
				</List.Section>

				<List.Section title='Sort_by'>
					<List.Separator />
					<List.Item
						title='Activity'
						testID='display-pref-view-activity'
						left={() => <List.Icon name='clock' />}
						onPress={sortByActivity}
						right={() => renderRadio(sortBy === SortBy.Activity)}
						additionalAccessibilityLabel={sortBy === SortBy.Activity}
						accessibilityRole='radio'
					/>
					<List.Separator />
					<List.Item
						title='Name'
						testID='display-pref-view-name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => renderRadio(sortBy === SortBy.Alphabetical)}
						additionalAccessibilityLabel={sortBy === SortBy.Alphabetical}
						accessibilityRole='radio'
					/>
					<List.Separator />
				</List.Section>

				<List.Section title='Group_by'>
					<List.Separator />
					<List.Item
						title='Unread_on_top'
						testID='display-pref-view-unread'
						left={() => <List.Icon name='flag' />}
						onPress={toggleUnread}
						right={() => renderCheckBox(showUnread)}
						additionalAccessibilityLabel={showUnread}
						accessibilityRole='checkbox'
					/>
					<List.Separator />
					<List.Item
						title='Favorites'
						testID='display-pref-view-favorites'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => renderCheckBox(showFavorites)}
						additionalAccessibilityLabel={showFavorites}
						accessibilityRole='checkbox'
					/>
					<List.Separator />
					<List.Item
						title='Types'
						testID='display-pref-view-types'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => renderCheckBox(groupByType)}
						additionalAccessibilityLabel={groupByType}
						accessibilityRole='checkbox'
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default DisplayPrefsView;
