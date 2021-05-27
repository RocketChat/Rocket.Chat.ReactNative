import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import { useTheme } from '../theme';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';

const setHeader = (navigation, isMasterDetail) => {
	const options = {
		headerTitle: I18n.t('Add_Channel_to_Team')
	};

	if (isMasterDetail) {
		options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
	}

	navigation.setOptions(options);
};

const AddChannelTeamView = ({
	navigation, route, isMasterDetail
}) => {
	const { teamId, teamChannels } = route.params;
	const { theme } = useTheme();

	useEffect(() => {
		setHeader(navigation, isMasterDetail);
	}, []);

	return (
		<SafeAreaView testID='add-channel-team-view'>
			<StatusBar />
			<List.Container>
				<List.Separator />
				<List.Item
					title='Create_New'
					onPress={() => (isMasterDetail
						? navigation.navigate('SelectedUsersViewCreateChannel', { nextAction: () => navigation.navigate('CreateChannelView', { teamId }) })
						: navigation.navigate('SelectedUsersView', { nextAction: () => navigation.navigate('ChatsStackNavigator', { screen: 'CreateChannelView', params: { teamId } }) }))
					}
					testID='add-channel-team-view-create-channel'
					left={() => <List.Icon name='team' />}
					right={() => <List.Icon name='chevron-right' />}
					theme={theme}
				/>
				<List.Separator />
				<List.Item
					title='Add_Existing'
					onPress={() => navigation.navigate('AddExistingChannelView', { teamId, teamChannels })}
					testID='add-channel-team-view-create-channel'
					left={() => <List.Icon name='channel-public' />}
					right={() => <List.Icon name='chevron-right' />}
					theme={theme}
				/>
				<List.Separator />
			</List.Container>
		</SafeAreaView>
	);
};

AddChannelTeamView.propTypes = {
	route: PropTypes.object,
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(AddChannelTeamView);
