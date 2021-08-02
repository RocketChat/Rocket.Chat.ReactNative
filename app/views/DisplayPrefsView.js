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

import { withTheme } from '../theme';
import { themes } from '../constants/colors';

import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { ICON_SIZE } from '../containers/List/constants';
import log, { events, logEvent } from '../utils/log';

const DisplayPrefsView = (props) => {
	const { theme } = props;

	const {
		sortBy,
		groupByType,
		showFavorites,
		showUnread,
		showAvatar,
		displayType
	} = useSelector(state => state.sortPreferences);
	const dispatch = useDispatch();

	const setHeader = () => {
		const { navigation, isMasterDetail } = props;
		navigation.setOptions({
			title: I18n.t('Display'),
			headerLeft: () => (isMasterDetail ? (
				<HeaderButton.CloseModal navigation={navigation} testID='display-view-close' />
			) : (
				<HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
			))
		});
	};

	useEffect(() => {
		setHeader();
	}, []);

	const setSortPreference = (param) => {
		try {
			dispatch(setPreference(param));
			RocketChat.saveSortPreference(param);
		} catch (e) {
			logEvent(events.RL_SORT_CHANNELS_F);
			log(e);
		}
	};

	const sortByName = () => {
		logEvent(events.RL_SORT_CHANNELS_BY_NAME);
		setSortPreference({ sortBy: 'alphabetical' });
	};

	const sortByActivity = () => {
		logEvent(events.RL_SORT_CHANNELS_BY_ACTIVITY);
		setSortPreference({ sortBy: 'activity' });
	};

	const toggleGroupByType = () => {
		logEvent(events.RL_GROUP_CHANNELS_BY_TYPE);
		setSortPreference({ groupByType: !groupByType });
	};

	const toggleGroupByFavorites = () => {
		logEvent(events.RL_GROUP_CHANNELS_BY_FAVORITE);
		setSortPreference({ showFavorites: !showFavorites });
	};

	const toggleUnread = () => {
		logEvent(events.RL_GROUP_CHANNELS_BY_UNREAD);
		setSortPreference({ showUnread: !showUnread });
	};

	const toggleAvatar = () => {
		setSortPreference({ showAvatar: !showAvatar });
	};

	const displayExpanded = () => {
		setSortPreference({ displayType: 'expanded' });
	};

	const displayCondensed = () => {
		setSortPreference({ displayType: 'condensed' });
	};

	const renderCheckBox = value => (
		value ? <List.Icon name='checkbox-checked' color={themes[theme].actionTintColor} /> : <List.Icon name='checkbox-unchecked' />
	);

	const renderAvatarSwitch = value => (
		<Switch
			value={value}
			onValueChange={() => toggleAvatar()}
			trackColor={{ true: themes[theme].actionTintColor }}
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
		<SafeAreaView testID='status-view'>
			<StatusBar />
			<List.Container testID='display-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Display'
					/>
					<List.Item
						left={() => <List.Icon name='view-extended' />}
						title='Expanded'
						right={() => renderRadio(displayType === 'expanded')}
						onPress={displayExpanded}
					/>
					<List.Item
						left={() => <List.Icon name='view-medium' />}
						title='Condensed'
						right={() => renderRadio(displayType === 'condensed')}
						onPress={displayCondensed}
					/>
					<List.Item
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						right={() => renderAvatarSwitch(showAvatar)}
					/>
				</List.Section>

				<List.Section>
					<List.Item
						title='Sort_by'
					/>
					<List.Item
						title='Activity'
						left={() => <List.Icon name='clock' />}
						onPress={sortByActivity}
						right={() => (renderRadio(sortBy === 'activity'))}
					/>
					<List.Item
						title='Name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => (renderRadio(sortBy === 'alphabetical'))}
					/>
				</List.Section>

				<List.Section>
					<List.Item
						title='Group_by'
					/>
					<List.Item
						title='Unread_on_top'
						left={() => <List.Icon name='unread-on-top-disabled' />}
						onPress={toggleUnread}
						right={() => (renderCheckBox(showUnread))}
					/>
					<List.Item
						title='Favorites'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => (renderCheckBox(showFavorites))}
					/>
					<List.Item
						title='Types'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => (renderCheckBox(groupByType))}
					/>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

DisplayPrefsView.propTypes = {
	theme: PropTypes.string,
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

export default (withTheme(DisplayPrefsView));
