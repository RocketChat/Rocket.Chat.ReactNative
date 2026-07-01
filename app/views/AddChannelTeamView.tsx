import { useLayoutEffect } from 'react';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type CompositeNavigationProp } from '@react-navigation/core';

import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { type ChatsStackParamList, type DrawerParamList, type NewMessageStackParamList } from '../stacks/types';
import { useCreateNewPermission, useAddExistingPermission } from '../lib/hooks/useTeamChannelPermissions';
import { useMasterDetail } from '../lib/hooks/useMasterDetail';

type TRoute = RouteProp<ChatsStackParamList, 'AddChannelTeamView'>;

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'AddChannelTeamView'>,
	CompositeNavigationProp<NativeStackNavigationProp<NewMessageStackParamList>, NativeStackNavigationProp<DrawerParamList>>
>;

const AddChannelTeamView = () => {
	const navigation = useNavigation<TNavigation>();
	const isMasterDetail = useMasterDetail();
	const {
		params: { teamId, rid, t }
	} = useRoute<TRoute>();

	const canCreateNew = useCreateNewPermission(rid, t);
	const canAddExisting = useAddExistingPermission(rid);

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Add_Channel_to_Team') });
	}, [navigation]);

	return (
		<SafeAreaView testID='add-channel-team-view'>
			<List.Container>
				<List.Separator />
				{canCreateNew ? (
					<>
						<List.Item
							title='Create_New'
							onPress={() =>
								isMasterDetail
									? navigation.navigate('SelectedUsersView', {
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
					</>
				) : null}
				{canAddExisting ? (
					<>
						<List.Item
							title='Add_Existing'
							onPress={() => navigation.navigate('AddExistingChannelView', { teamId })}
							testID='add-channel-team-view-add-existing'
							left={() => <List.Icon name='channel-public' />}
							right={() => <List.Icon name='chevron-right' />}
						/>
						<List.Separator />
					</>
				) : null}
			</List.Container>
		</SafeAreaView>
	);
};

export default AddChannelTeamView;
