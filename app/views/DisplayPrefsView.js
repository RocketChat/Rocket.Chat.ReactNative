import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Switch } from 'react-native';

import { RadioButton } from 'react-native-ui-lib';
import StatusBar from '../containers/StatusBar';
import I18n from '../i18n';
import * as List from '../containers/List';
import Loading from '../containers/Loading';

import { withTheme } from '../theme';
import { themes } from '../constants/colors';

import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { ICON_SIZE } from '../containers/List/constants';

const DisplayPrefsView = (props) => {
	const { theme } = props;
	const [loading] = useState(false);



	// constructor(props) {
	// 	super(props);

	// 	const { statusText } = props.user;
	// 	this.state = { statusText: statusText || '', loading: false };
	// 	this.setHeader();
	// }


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

	const sortByName = () => {
		// logEvent(events.RL_SORT_CHANNELS_BY_NAME);
		// this.setSortPreference({ sortBy: 'alphabetical' });
		// this.close();
	};

	const sortByActivity = () => {
		// logEvent(events.RL_SORT_CHANNELS_BY_ACTIVITY);
		// this.setSortPreference({ sortBy: 'activity' });
		// this.close();
	};

	const toggleGroupByType = () => {
		// logEvent(events.RL_GROUP_CHANNELS_BY_TYPE);
		// const { groupByType } = this.props;
		// this.setSortPreference({ groupByType: !groupByType });
	};

	const toggleGroupByFavorites = () => {
		// logEvent(events.RL_GROUP_CHANNELS_BY_FAVORITE);
		// const { showFavorites } = this.props;
		// this.setSortPreference({ showFavorites: !showFavorites });
	};

	const toggleUnread = () => {
		// logEvent(events.RL_GROUP_CHANNELS_BY_UNREAD);
		// const { showUnread } = this.props;
		// this.setSortPreference({ showUnread: !showUnread });
	};

	const renderCheckBox = value => (
		value ? <List.Icon name='checkbox-checked' color={themes[theme].actionTintColor} /> : <List.Icon name='checkbox-unchecked' />
	);

	const renderAvatarSwitch = () => (
		<Switch />
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
						left={() => <List.Icon name='avatar' />}
						title='Avatars'
						right={() => renderAvatarSwitch()}
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
						right={() => (renderRadio(true))}
					/>
					<List.Item
						title='Name'
						left={() => <List.Icon name='sort-az' />}
						onPress={sortByName}
						right={() => (renderRadio())}
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
						right={() => (renderCheckBox(true))}
					/>
					<List.Item
						title='Favorites'
						left={() => <List.Icon name='star' />}
						onPress={toggleGroupByFavorites}
						right={() => (renderCheckBox(true))}
					/>
					<List.Item
						title='Types'
						left={() => <List.Icon name='group-by-type' />}
						onPress={toggleGroupByType}
						right={() => (renderCheckBox())}
					/>
				</List.Section>


			</List.Container>

			<Loading visible={loading} />
		</SafeAreaView>
	);
};

DisplayPrefsView.propTypes = {
	user: PropTypes.shape({
		id: PropTypes.string,
		status: PropTypes.string,
		statusText: PropTypes.string
	}),
	theme: PropTypes.string,
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

export default (withTheme(DisplayPrefsView));
