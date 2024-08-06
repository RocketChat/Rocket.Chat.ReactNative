import { Q } from '@nozbe/watermelondb';
import orderBy from 'lodash/orderBy';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';
import { Subscription } from 'rxjs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { addUser, removeUser, reset } from '../../actions/selectedUsers';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import database from '../../lib/database';
import UserItem from '../../containers/UserItem';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { getUserSelector } from '../../selectors/login';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { search as searchMethod, TSearch } from '../../lib/methods';
import { isGroupChat as isGroupChatMethod } from '../../lib/methods/helpers';
import { useAppSelector } from '../../lib/hooks';
import Header from './Header';

type TRoute = RouteProp<ChatsStackParamList, 'SelectedUsersView'>;
type TNavigation = NativeStackNavigationProp<ChatsStackParamList, 'SelectedUsersView'>;

const SelectedUsersView = () => {
	const [chats, setChats] = useState<ISelectedUser[]>([]);
	const [search, setSearch] = useState<TSearch[]>([]);

	const { maxUsers, showButton, title, buttonText, showSkipText = true, nextAction } = useRoute<TRoute>().params;
	const navigation = useNavigation<TNavigation>();

	const { colors } = useTheme();
	const dispatch = useDispatch();

	const { users, loading, useRealName, user } = useAppSelector(
		state => ({
			users: state.selectedUsers.users,
			loading: state.selectedUsers.loading,
			useRealName: state.settings.UI_Use_Real_Name as boolean,
			user: getUserSelector(state)
		}),
		shallowEqual
	);

	useEffect(() => {
		sendLoadingEvent({ visible: loading });
	}, [loading]);

	const isChecked = (username: string) => users.findIndex(el => el.name === username) !== -1;

	const isGroupChat = () => maxUsers && maxUsers > 2;

	const handleButtonTitle = (buttonTextHeader: string) => {
		if (users.length > 0) {
			return buttonTextHeader;
		}
		return showSkipText ? I18n.t('Skip') : '';
	};

	useLayoutEffect(() => {
		const titleHeader = title ?? I18n.t('Select_Members');
		const buttonTextHeader = buttonText ?? I18n.t('Next');
		const nextActionHeader = nextAction ?? (() => {});
		const buttonTitle = handleButtonTitle(buttonTextHeader);
		const options = {
			title: titleHeader,
			headerRight: () =>
				(!maxUsers || showButton || (isGroupChat() && users.length > 1)) &&
				!!buttonTitle && (
					<HeaderButton.Container>
						<HeaderButton.Item title={buttonTitle} onPress={nextActionHeader} testID='selected-users-view-submit' />
					</HeaderButton.Container>
				)
		};
		navigation.setOptions(options);
	}, [navigation, users.length, maxUsers]);

	useEffect(() => {
		if (isGroupChat()) {
			dispatch(addUser({ _id: user.id, name: user.username, fname: user.name as string }));
		}
	}, []);

	useEffect(() => {
		let querySubscription: Subscription;
		const init = async () => {
			try {
				const db = database.active;
				const observable = await db.get('subscriptions').query(Q.where('t', 'd')).observeWithColumns(['room_updated_at']);

				querySubscription = observable.subscribe(data => {
					const chats = orderBy(data, ['roomUpdatedAt'], ['desc']) as ISelectedUser[];
					setChats(chats);
				});
			} catch (e) {
				log(e);
			}
		};
		init();

		return () => {
			dispatch(reset());
			if (querySubscription && querySubscription.unsubscribe) {
				querySubscription.unsubscribe();
			}
		};
	}, [dispatch]);

	const handleSearch = useCallback(async (text: string) => {
		const result = await searchMethod({ text, filterRooms: false });
		setSearch(result);
	}, []);

	const toggleUser = (userItem: ISelectedUser) => {
		// Disallow removing self user from the direct message group
		if (isGroupChat() && user.username === userItem.name) {
			return;
		}

		if (!isChecked(userItem.name)) {
			if (isGroupChat() && users.length === maxUsers) {
				return showErrorAlert(I18n.t('Max_number_of_users_allowed_is_number', { maxUsers }), I18n.t('Oops'));
			}
			logEvent(events.SELECTED_USERS_ADD_USER);
			dispatch(addUser(userItem));
		} else {
			logEvent(events.SELECTED_USERS_REMOVE_USER);
			dispatch(removeUser(userItem));
		}
	};

	const _onPressItem = (item = {} as ISelectedUser) => {
		if (item.search) {
			toggleUser({ _id: item._id, name: item.username as string, fname: item.name });
		} else {
			toggleUser({ _id: item._id, name: item.name, fname: item.fname });
		}
	};

	const searchOrChats = (search.length > 0 ? search : chats) as ISelectedUser[];
	// filter DM between multiple users
	const data = searchOrChats.filter(sub => !isGroupChatMethod(sub));

	return (
		<SafeAreaView testID='select-users-view'>
			<StatusBar />
			<FlatList
				data={data}
				keyExtractor={item => item._id}
				renderItem={({ item }) => {
					const name = useRealName && item.fname ? item.fname : item.name;
					const username = item.search ? (item.username as string) : item.name;
					return (
						<UserItem
							name={name}
							username={username}
							onPress={() => _onPressItem(item)}
							testID={`select-users-view-item-${item.name}`}
							icon={isChecked(username) ? 'checkbox-checked' : 'checkbox-unchecked'}
							iconColor={isChecked(username) ? colors.fontHint : colors.strokeLight}
							isChecked={isChecked(username)}
						/>
					);
				}}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={<List.Separator />}
				ListHeaderComponent={<Header useRealName={useRealName} onChangeText={handleSearch} onPressItem={toggleUser} />}
				contentContainerStyle={{ backgroundColor: colors.surfaceRoom }}
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default SelectedUsersView;
