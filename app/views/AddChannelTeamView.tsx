import React, { useLayoutEffect } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { CompositeNavigationProp } from '@react-navigation/core';

import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { ChatsStackParamList, DrawerParamList, NewMessageStackParamList } from '../stacks/types';
import { IApplicationState } from '../definitions';

type TRoute = RouteProp<ChatsStackParamList, 'AddChannelTeamView'>;

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'AddChannelTeamView'>,
	CompositeNavigationProp<NativeStackNavigationProp<NewMessageStackParamList>, NativeStackNavigationProp<DrawerParamList>>
>;

const AddChannelTeamView = () => {
	const navigation = useNavigation<TNavigation>();
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const {
		params: { teamId }
	} = useRoute<TRoute>();

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Add_Channel_to_Team') });
	}, [navigation]);

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
					onPress={() => navigation.navigate('AddExistingChannelView', { teamId })}
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
