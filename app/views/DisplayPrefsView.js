import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Switch, Text } from 'react-native';

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
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		letterSpacing: 0.27,
		lineHeight: 24,
		flexShrink: 1,
		...sharedStyles.textBold
	}
});


const DisplayPrefsView = (props) => {
	const { theme } = useTheme();

	const {
		sortBy,
		groupByType,
		showFavorites,
		showUnread,
		showAvatar,
		displayType
	} = useSelector(state => state.sortPreferences);
	const dispatch = useDispatch();

	useEffect(() => {
		const { navigation, isMasterDetail } = props;
		navigation.setOptions({
			title: I18n.t('Display'),
			headerLeft: () => (isMasterDetail ? (
				<HeaderButton.CloseModal navigation={navigation} testID='display-view-close' />
			) : (
				<HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
			))
		});
	}, []);

	const setSortPreference = (param) => {
		try {
			dispatch(setPreference(param));
			RocketChat.saveSortPreference(param);
		} catch (e) {
			logEvent(events.DP_SORT_CHANNELS_F);
			log(e);
		}
	};

	const sortByName = () => {
		logEvent(events.DP_SORT_CHANNELS_BY_NAME);
		setSortPreference({ sortBy: 'alphabetical' });
	};

	const sortByActivity = () => {
		logEvent(events.DP_SORT_CHANNELS_BY_ACTIVITY);
		setSortPreference({ sortBy: 'activity' });
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
		setSortPreference({ displayType: 'expanded' });
	};

	const displayCondensed = () => {
		logEvent(events.DP_DISPLAY_CONDENSED);
		setSortPreference({ displayType: 'condensed' });
	};

	const renderCheckBox = value => (
		<List.Icon
			name={value ? 'checkbox-checked' : 'checkbox-unchecked'}
			color={value ? themes[theme].actionTintColor : null}
		/>
	);

	const renderAvatarSwitch = value => (
		<Switch
			value={value}
			onValueChange={() => toggleAvatar()}
			testID='avatar-switch'
			style={{ transform: [{ scale: 0.8 }] }}
		/>
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
				<List.Section>
					<List.Separator />
					<List.Item
						left={() => (
							<Text
								style={[styles.title, { color: themes[theme].titleText }]}
								numberOfLines={1}
							>{I18n.t('Display')}
							</Text>
						)}
					/>
					<List.Item
						left={() => <List.Icon name='view-extended' />}
						title='Expanded'
						testID='expanded-display-pref'
						right={() => renderRadio(displayType === 'expanded')}
						onPress={displayExpanded}
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						testID='condensed-display-pref'
						right={() => renderRadio(displayType === 'condensed')}
						onPress={displayCondensed}
					/>
					<List.Separator />
					<List.Item
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						testID='avatars-display-pref'
						right={() => renderAvatarSwitch(showAvatar)}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						left={() => (
							<Text
								style={[styles.title, { color: themes[theme].titleText }]}
								numberOfLines={1}
							>{I18n.t('Sort_by')}
							</Text>
						)}
					/>
					<List.Item
						title='Activity'
						testID='activity-display-pref'
						left={() => <List.Icon name='clock' />}
						onPress={sortByActivity}
						right={() => (renderRadio(sortBy === 'activity'))}
					/>
					<List.Separator />
					<List.Item
						title='Name'
						testID='name-display-pref'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => (renderRadio(sortBy === 'alphabetical'))}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						left={() => (
							<Text
								style={[styles.title, { color: themes[theme].titleText }]}
								numberOfLines={1}
							>{I18n.t('Group_by')}
							</Text>
						)}
					/>
					<List.Item
						title='Unread_on_top'
						testID='unread-display-pref'
						left={() => <List.Icon name='flag' />}
						onPress={toggleUnread}
						right={() => (renderCheckBox(showUnread))}
					/>
					<List.Separator />
					<List.Item
						title='Favorites'
						testID='favorites-display-pref'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => (renderCheckBox(showFavorites))}
					/>
					<List.Separator />
					<List.Item
						title='Types'
						testID='types-display-pref'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => (renderCheckBox(groupByType))}
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

export default (DisplayPrefsView);
