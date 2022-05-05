import React, { useEffect } from 'react';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { CompositeNavigationProp } from '@react-navigation/core';

import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { ChatsStackParamList, DrawerParamList, NewMessageStackParamList } from '../stacks/types';
import { IApplicationState } from '../definitions';

type TRoute = RouteProp<ChatsStackParamList, 'AddChannelTeamView'>;

type TNavigation = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'AddChannelTeamView'>,
	CompositeNavigationProp<StackNavigationProp<NewMessageStackParamList>, StackNavigationProp<DrawerParamList>>
>;

const setHeader = ({
	navigation,
	isMasterDetail
}: {
	navigation: StackNavigationProp<ChatsStackParamList, 'AddChannelTeamView'>;
	isMasterDetail: boolean;
}) => {
	const options: StackNavigationOptions = {
		headerTitle: I18n.t('Add_Channel_to_Team')
	};

	if (isMasterDetail) {
		options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
	}

	navigation.setOptions(options);
};

const AddChannelTeamView = () => {
	const navigation = useNavigation<TNavigation>();
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const { teamChannels, teamId } = useRoute<TRoute>().params;

	useEffect(() => {
		setHeader({ navigation, isMasterDetail });
	}, [isMasterDetail, navigation]);

	return (
		<SafeAreaView testID='add-channel-team-view'>
			<StatusBar />
			<List.Container>
				<List.Separator />
				<List.Item
					title='Create_New'
					onPress={() =>
						isMasterDetail
							? navigation.navigate('SelectedUsersViewCreateChannel', {
									nextAction: () => navigation.navigate('CreateChannelView', { teamId })
							  })
							: navigation.navigate('SelectedUsersView', {
									nextAction: () =>
										navigation.navigate('ChatsStackNavigator', { screen: 'CreateChannelView', params: { teamId } })
							  })
					}
					testID='add-channel-team-view-create-channel'
					left={() => <List.Icon name='team' />}
					right={() => <List.Icon name='chevron-right' />}
				/>
				<List.Separator />
				<List.Item
					title='Add_Existing'
					onPress={() => navigation.navigate('AddExistingChannelView', { teamId, teamChannels })}
					testID='add-channel-team-view-add-existing'
					left={() => <List.Icon name='channel-public' />}
					right={() => <List.Icon name='chevron-right' />}
				/>
				<List.Separator />
			</List.Container>
		</SafeAreaView>
	);
};

export default AddChannelTeamView;
