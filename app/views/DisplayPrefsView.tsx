import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Switch } from 'react-native';
import { RadioButton } from 'react-native-ui-lib';
import { useDispatch, useSelector } from 'react-redux';

import { setPreference } from '../actions/sortPreferences';
import { DisplayMode, SortBy, themes } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import { ICON_SIZE } from '../containers/List/constants';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { IApplicationState, IPreferences } from '../definitions';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import { SettingsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { events, logEvent } from '../utils/log';

interface IDisplayPrefsView {
	navigation: StackNavigationProp<SettingsStackParamList, 'DisplayPrefsView'>;
	isMasterDetail: boolean;
}

const DisplayPrefsView = (props: IDisplayPrefsView): JSX.Element => {
	const { theme } = useTheme();

	const { sortBy, groupByType, showFavorites, showUnread, showAvatar, displayMode } = useSelector(
		(state: IApplicationState) => state.sortPreferences
	);
	const { isMasterDetail } = useSelector((state: any) => state.app);
	const dispatch = useDispatch();

	useEffect(() => {
		const { navigation } = props;
		navigation.setOptions({
			title: I18n.t('Display')
		});
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => <HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
			});
		}
	}, []);

	const setSortPreference = (param: Partial<IPreferences>) => {
		dispatch(setPreference(param));
		RocketChat.saveSortPreference(param);
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
		<List.Icon name={value ? 'checkbox-checked' : 'checkbox-unchecked'} color={value ? themes[theme].actionTintColor : null} />
	);

	const renderAvatarSwitch = (value: boolean) => (
		<Switch value={value} onValueChange={() => toggleAvatar()} testID='display-pref-view-avatar-switch' />
	);

	const renderRadio = (value: boolean) => (
		<RadioButton
			selected={!!value}
			color={value ? themes[theme].actionTintColor : themes[theme].auxiliaryText}
			size={ICON_SIZE}
		/>
	);

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
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						testID='display-pref-view-condensed'
						right={() => renderRadio(displayMode === DisplayMode.Condensed)}
						onPress={displayCondensed}
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						testID='display-pref-view-avatars'
						right={() => renderAvatarSwitch(showAvatar)}
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
					/>
					<List.Separator />
					<List.Item
						title='Name'
						testID='display-pref-view-name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => renderRadio(sortBy === SortBy.Alphabetical)}
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
					/>
					<List.Separator />
					<List.Item
						title='Favorites'
						testID='display-pref-view-favorites'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => renderCheckBox(showFavorites)}
					/>
					<List.Separator />
					<List.Item
						title='Types'
						testID='display-pref-view-types'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => renderCheckBox(groupByType)}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

DisplayPrefsView.propTypes = {};

export default DisplayPrefsView;
