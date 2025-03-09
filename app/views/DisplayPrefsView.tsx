import React, { useEffect } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Switch } from 'react-native';
import { useDispatch } from 'react-redux';

import { setPreference } from '../actions/sortPreferences';
import { DisplayMode, SortBy } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import { ICON_SIZE } from '../containers/List/constants';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import Radio from '../containers/Radio';
import { IPreferences } from '../definitions';
import I18n from '../i18n';
import { SettingsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { events, logEvent } from '../lib/methods/helpers/log';
import { saveSortPreference } from '../lib/methods';
import { useAppSelector } from '../lib/hooks';

const DisplayPrefsView = (): React.ReactElement => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'DisplayPrefsView'>>();
	const { colors } = useTheme();

	const { sortBy, groupByType, showFavorites, showUnread, showAvatar, displayMode } = useAppSelector(
		state => state.sortPreferences
	);
	const { isMasterDetail } = useAppSelector(state => state.app);
	const dispatch = useDispatch();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Display')
		});
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => <HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
			});
		}
	}, [isMasterDetail, navigation]);

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
		<Switch value={value} onValueChange={() => toggleAvatar()} testID='display-pref-view-avatar-switch' />
	);

	const renderRadio = (value: boolean) => <Radio check={value} size={ICON_SIZE} />;

	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container testID='display-view-list'>
				<List.Section title='Display'>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-extended' />}
						title='Expanded'
						testID='display-pref-view-expanded'
						right={() => renderRadio(displayMode === DisplayMode.Expanded)}
						onPress={displayExpanded}
						additionalAcessibilityLabel={displayMode === DisplayMode.Expanded}
						accessibilityRole='radio'
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						testID='display-pref-view-condensed'
						right={() => renderRadio(displayMode === DisplayMode.Condensed)}
						onPress={displayCondensed}
						additionalAcessibilityLabel={displayMode === DisplayMode.Condensed}
						accessibilityRole='radio'
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						testID='display-pref-view-avatars'
						right={() => renderAvatarSwitch(showAvatar)}
						additionalAcessibilityLabel={showAvatar}
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
						additionalAcessibilityLabel={sortBy === SortBy.Activity}
						accessibilityRole='radio'
					/>
					<List.Separator />
					<List.Item
						title='Name'
						testID='display-pref-view-name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => renderRadio(sortBy === SortBy.Alphabetical)}
						additionalAcessibilityLabel={sortBy === SortBy.Alphabetical}
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
						additionalAcessibilityLabel={showUnread}
						accessibilityRole='checkbox'
					/>
					<List.Separator />
					<List.Item
						title='Favorites'
						testID='display-pref-view-favorites'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => renderCheckBox(showFavorites)}
						additionalAcessibilityLabel={showFavorites}
						accessibilityRole='checkbox'
					/>
					<List.Separator />
					<List.Item
						title='Types'
						testID='display-pref-view-types'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => renderCheckBox(groupByType)}
						additionalAcessibilityLabel={groupByType}
						accessibilityRole='checkbox'
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default DisplayPrefsView;
