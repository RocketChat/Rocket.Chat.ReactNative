import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { HeaderBackButton } from '@react-navigation/stack';

import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import { withTheme } from '../theme';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { withDimensions } from '../dimensions';
import { themes } from '../constants/colors';
import I18n from '../i18n';

const AddChannelTeamView = ({
	navigation, route, isMasterDetail, theme
}) => {
	const { teamId, teamChannels } = route.params;

	const setHeader = () => {
		const options = {
			headerShown: true,
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Add_Channel_to_Team')
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		} else {
			options.headerLeft = () => (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.pop()}
					tintColor={themes[theme].headerTintColor}
				/>
			);
		}

		navigation.setOptions(options);
	};

	useEffect(() => {
		setHeader();
	}, []);

	return (
		<SafeAreaView testID='add-channel-team-view'>
			<StatusBar />
			<List.Container>
				<List.Item
					title='Create_New'
					onPress={() => navigation.navigate('NewMessageStackNavigator', { screen: 'SelectedUsersViewCreateChannel', params: { nextAction: () => navigation.navigate('CreateChannelView', { teamId }) } })}
					testID='add-channel-team-view-create-channel'
					left={() => <List.Icon name='team' />}
					theme={theme}
				/>
				<List.Item
					title='Add_Existing'
					onPress={() => navigation.navigate('AddExistingChannelView', { teamId, teamChannels })}
					testID='add-channel-team-view-create-channel'
					left={() => <List.Icon name='channel-public' />}
					theme={theme}
				/>
			</List.Container>
		</SafeAreaView>
	);
};

AddChannelTeamView.propTypes = {
	route: PropTypes.object,
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool,
	theme: PropTypes.string
};

export default withDimensions(withTheme(AddChannelTeamView));
