import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch } from 'react-native';
import { RadioButton } from 'react-native-ui-lib';
import { useDispatch, useSelector } from 'react-redux';

import { setPreference } from '../actions/sortPreferences';
import RocketChat from '../lib/rocketchat';
import StatusBar from '../containers/StatusBar';
import I18n from '../i18n';
import * as List from '../containers/List';
import { useTheme } from '../theme';
import { themes } from '../constants/colors';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { ICON_SIZE } from '../containers/List/constants';
import log, { events, logEvent } from '../utils/log';
import { DISPLAY_MODE_CONDENSED, DISPLAY_MODE_EXPANDED } from '../constants/constantDisplayMode';

const DisplayPrefsView = props => {
	const { theme } = useTheme();

	const { sortBy, groupByType, showFavorites, showUnread, showAvatar, displayMode } = useSelector(state => state.sortPreferences);
	const dispatch = useDispatch();

	useEffect(() => {
		const { navigation, isMasterDetail } = props;
		navigation.setOptions({
			title: I18n.t('Display'),
			headerLeft: () =>
				isMasterDetail ? (
					<HeaderButton.CloseModal navigation={navigation} testID='display-view-close' />
				) : (
					<HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
				)
		});
	}, []);

	const setSortPreference = async param => {
		try {
			dispatch(setPreference(param));
			await RocketChat.saveSortPreference(param);
		} catch (e) {
			log(e);
		}
	};

	const sortByName = async () => {
		logEvent(events.DP_SORT_CHANNELS_BY_NAME);
		await setSortPreference({ sortBy: 'alphabetical' });
	};

	const sortByActivity = async () => {
		logEvent(events.DP_SORT_CHANNELS_BY_ACTIVITY);
		await setSortPreference({ sortBy: 'activity' });
	};

	const toggleGroupByType = async () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_TYPE);
		await setSortPreference({ groupByType: !groupByType });
	};

	const toggleGroupByFavorites = async () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_FAVORITE);
		await setSortPreference({ showFavorites: !showFavorites });
	};

	const toggleUnread = async () => {
		logEvent(events.DP_GROUP_CHANNELS_BY_UNREAD);
		await setSortPreference({ showUnread: !showUnread });
	};

	const toggleAvatar = async () => {
		logEvent(events.DP_TOGGLE_AVATAR);
		await setSortPreference({ showAvatar: !showAvatar });
	};

	const displayExpanded = async () => {
		logEvent(events.DP_DISPLAY_EXPANDED);
		await setSortPreference({ displayMode: DISPLAY_MODE_EXPANDED });
	};

	const displayCondensed = async () => {
		logEvent(events.DP_DISPLAY_CONDENSED);
		await setSortPreference({ displayMode: DISPLAY_MODE_CONDENSED });
	};

	const renderCheckBox = value => (
		<List.Icon name={value ? 'checkbox-checked' : 'checkbox-unchecked'} color={value ? themes[theme].actionTintColor : null} />
	);

	const renderAvatarSwitch = value => (
		<Switch value={value} onValueChange={() => toggleAvatar()} testID='display-pref-view-avatar-switch' />
	);

	const renderRadio = value => (
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
						right={() => renderRadio(displayMode === DISPLAY_MODE_EXPANDED)}
						onPress={displayExpanded}
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						testID='display-pref-view-condensed'
						right={() => renderRadio(displayMode === DISPLAY_MODE_CONDENSED)}
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
						right={() => renderRadio(sortBy === 'activity')}
					/>
					<List.Separator />
					<List.Item
						title='Name'
						testID='display-pref-view-name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => renderRadio(sortBy === 'alphabetical')}
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

DisplayPrefsView.propTypes = {
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

export default DisplayPrefsView;
