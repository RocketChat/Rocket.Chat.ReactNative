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
import { usePermissions } from '../lib/hooks';
import { compareServerVersion } from '../lib/methods/helpers';
import { TSupportedPermissions } from '../reducers/permissions';

type TRoute = RouteProp<ChatsStackParamList, 'AddChannelTeamView'>;

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'AddChannelTeamView'>,
	CompositeNavigationProp<NativeStackNavigationProp<NewMessageStackParamList>, NativeStackNavigationProp<DrawerParamList>>
>;

const useCreateNewPermission = (rid: string, t: 'c' | 'p') => {
	const permissions: TSupportedPermissions[] = t === 'c' ? ['create-c'] : ['create-p'];

	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
		permissions.push(t === 'c' ? 'create-team-channel' : 'create-team-group');
	}

	const result = usePermissions(permissions, rid);
	return result.some(Boolean);
};

const useAddExistingPermission = (rid: string) => {
	let permissions: TSupportedPermissions[] = ['add-team-channel'];

	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
		permissions = ['move-room-to-team'];
	}

	const result = usePermissions(permissions, rid);
	return result[0];
};

const AddChannelTeamView = () => {
	const navigation = useNavigation<TNavigation>();
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
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
			<StatusBar />
			<List.Container>
				<List.Separator />
				{canCreateNew ? (
					<>
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
