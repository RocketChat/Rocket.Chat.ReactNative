import { Q } from '@nozbe/watermelondb';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { shallowEqual } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { ISearch, TSubscriptionModel } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { useTheme } from '../../theme';
import { goRoom as goRoomMethod, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { NewMessageStackParamList } from '../../stacks/types';
import { search as searchMethod } from '../../lib/methods';
import { useAppSelector } from '../../lib/hooks';
import UserItem from '../../containers/UserItem';
import HeaderNewMessage from './HeaderNewMessage';

const QUERY_SIZE = 50;

type TItem = ISearch | TSubscriptionModel;

const NewMessageView = () => {
	const [chats, setChats] = useState<TSubscriptionModel[]>([]);
	const [search, setSearch] = useState<TItem[]>([]);

	const { colors } = useTheme();

	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();

	const { isMasterDetail, maxUsers, useRealName } = useAppSelector(
		state => ({
			isMasterDetail: state.app.isMasterDetail,
			maxUsers: (state.settings.DirectMesssage_maxUsers as number) || 1,
			useRealName: state.settings.UI_Use_Real_Name as boolean
		}),
		shallowEqual
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='new-message-view-close' />,
			title: I18n.t('Create_New')
		});
	}, [navigation]);

	useEffect(() => {
		const init = async () => {
			try {
				const db = database.active;
				const c = await db
					.get('subscriptions')
					.query(Q.where('t', 'd'), Q.take(QUERY_SIZE), Q.sortBy('room_updated_at', Q.desc))
					.fetch();
				setChats(c);
			} catch (e) {
				log(e);
			}
		};

		init();
	}, []);

	const handleSearch = useCallback(async (text: string) => {
		const result = (await searchMethod({ text, filterRooms: false })) as ISearch[];
		setSearch(result);
	}, []);

	const goRoom = useCallback(
		(item: TGoRoomItem) => {
			logEvent(events.NEW_MSG_CHAT_WITH_USER);
			navigation.pop();
			goRoomMethod({ item, isMasterDetail });
		},
		[isMasterDetail, navigation]
	);

	return (
		<SafeAreaView testID='new-message-view'>
			<StatusBar />
			<FlatList
				data={search.length > 0 ? search : chats}
				keyExtractor={item => item._id || item.rid}
				ListHeaderComponent={<HeaderNewMessage maxUsers={maxUsers} onChangeText={handleSearch} />}
				renderItem={({ item }) => {
					const itemSearch = item as ISearch;
					const itemModel = item as TSubscriptionModel;

					return (
						<UserItem
							name={useRealName && itemSearch.fname ? itemSearch.fname : itemModel.name}
							username={itemSearch.search ? itemSearch.username : itemModel.name}
							onPress={() => goRoom(itemModel)}
							testID={`new-message-view-item-${item.name}`}
						/>
					);
				}}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: colors.surfaceRoom }}
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default NewMessageView;
