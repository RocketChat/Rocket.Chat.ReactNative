import React, { useEffect, useLayoutEffect, useState } from 'react';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FlatList } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import * as List from '../../containers/List';
import database from '../../lib/database';
import I18n from '../../i18n';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import SearchBox from '../../containers/SearchBox';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { sendLoadingEvent } from '../../containers/Loading';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import { ChatsStackParamList } from '../../stacks/types';
import { TSubscriptionModel, SubscriptionType } from '../../definitions';
import { compareServerVersion, getRoomTitle, hasPermission, useDebounce } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';

type TNavigation = NativeStackNavigationProp<ChatsStackParamList, 'AddExistingChannelView'>;
type TRoute = RouteProp<ChatsStackParamList, 'AddExistingChannelView'>;

const QUERY_SIZE = 50;

const AddExistingChannelView = () => {
	const [channels, setChannels] = useState<TSubscriptionModel[]>([]);
	const [selected, setSelected] = useState<string[]>([]);

	const { colors } = useTheme();

	const navigation = useNavigation<TNavigation>();
	const {
		params: { teamId }
	} = useRoute<TRoute>();

	const { serverVersion, addTeamChannelPermission, isMasterDetail, moveRoomToTeamPermission } = useAppSelector(state => ({
		serverVersion: state.server.version,
		isMasterDetail: state.app.isMasterDetail,
		addTeamChannelPermission: state.permissions['add-team-channel'],
		moveRoomToTeamPermission: state.permissions['move-room-to-team']
	}));

	useLayoutEffect(() => {
		setHeader();
	}, [selected.length]);

	useEffect(() => {
		query();
	}, []);

	const setHeader = () => {
		const options: NativeStackNavigationOptions = {
			headerTitle: I18n.t('Add_Existing_Channel')
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () =>
			selected.length > 0 && (
				<HeaderButton.Container>
					<HeaderButton.Item title={I18n.t('Next')} onPress={submit} testID='add-existing-channel-view-submit' />
				</HeaderButton.Container>
			);

		navigation.setOptions(options);
	};

	const hasCreatePermission = async (id: string) => {
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
			const result = await hasPermission([moveRoomToTeamPermission], id);
			return result[0];
		}
		const result = await hasPermission([addTeamChannelPermission], id);
		return result[0];
	};

	const query = async (stringToSearch = '') => {
		try {
			const db = database.active;
			const channels = await db
				.get('subscriptions')
				.query(
					Q.where('team_id', ''),
					Q.where('t', Q.oneOf(['c', 'p'])),
					Q.where('name', Q.like(`%${stringToSearch}%`)),
					Q.take(QUERY_SIZE),
					Q.sortBy('room_updated_at', Q.desc)
				)
				.fetch();

			const asyncFilter = async (channelsArray: TSubscriptionModel[]) => {
				const results = await Promise.all(
					channelsArray.map(async channel => {
						if (channel.prid) {
							return false;
						}
						const result = await hasCreatePermission(channel.rid);
						return result;
					})
				);

				return channelsArray.filter((_v: any, index: number) => results[index]);
			};
			const channelFiltered = await asyncFilter(channels);
			setChannels(channelFiltered);
		} catch (e) {
			log(e);
		}
	};

	const onSearchChangeText = useDebounce((text: string) => {
		query(text);
	}, 300);

	const isChecked = (rid: string) => selected.includes(rid);

	const toggleChannel = (rid: string) => {
		animateNextTransition();
		if (!isChecked(rid)) {
			logEvent(events.AEC_ADD_CHANNEL);
			setSelected([...selected, rid]);
		} else {
			logEvent(events.AEC_REMOVE_CHANNEL);
			const filterSelected = selected.filter(el => el !== rid);
			setSelected(filterSelected);
		}
	};

	const submit = async () => {
		sendLoadingEvent({ visible: true });
		try {
			logEvent(events.CT_ADD_ROOM_TO_TEAM);
			const result = await Services.addRoomsToTeam({ rooms: selected, teamId });
			if (result.success) {
				sendLoadingEvent({ visible: false });
				// Expect that after you add an existing channel to a team, the user should move back to the team
				navigation.navigate('RoomView');
			}
		} catch (e: any) {
			logEvent(events.CT_ADD_ROOM_TO_TEAM_F);
			showErrorAlert(I18n.t(e.data.error), I18n.t('Add_Existing_Channel'), () => {});
			sendLoadingEvent({ visible: false });
		}
	};

	return (
		<SafeAreaView testID='add-existing-channel-view'>
			<StatusBar />
			<FlatList
				data={channels}
				extraData={channels}
				keyExtractor={item => item.id}
				ListHeaderComponent={
					<SearchBox onChangeText={(text: string) => onSearchChangeText(text)} testID='add-existing-channel-view-search' />
				}
				renderItem={({ item }: { item: TSubscriptionModel }) => {
					// TODO: reuse logic inside RoomTypeIcon
					const icon = item.t === SubscriptionType.GROUP && !item?.teamId ? 'channel-private' : 'channel-public';
					return (
						<List.Item
							title={getRoomTitle(item)}
							translateTitle={false}
							onPress={() => toggleChannel(item.rid)}
							testID={`add-existing-channel-view-item-${item.name}`}
							left={() => <List.Icon name={icon} />}
							right={() => (isChecked(item.rid) ? <List.Icon name='check' color={colors.fontHint} /> : null)}
							additionalAcessibilityLabel={isChecked(item.rid)}
							additionalAcessibilityLabelCheck
						/>
					);
				}}
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: colors.surfaceRoom }}
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default AddExistingChannelView;
