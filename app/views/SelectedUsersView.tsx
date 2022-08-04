import { Q } from '@nozbe/watermelondb';
import orderBy from 'lodash/orderBy';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, View, Text } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';
import { Subscription } from 'rxjs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { addUser, removeUser, reset } from '../actions/selectedUsers';
import { themes } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import Loading from '../containers/Loading';
import SafeAreaView from '../containers/SafeAreaView';
import SearchBox from '../containers/SearchBox';
import StatusBar from '../containers/StatusBar';
import { ISearch, ISearchLocal } from '../definitions';
import I18n from '../i18n';
import database from '../lib/database';
import UserItem from '../containers/UserItem';
import { ISelectedUser } from '../reducers/selectedUsers';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { showErrorAlert } from '../lib/methods/helpers/info';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import sharedStyles from './Styles';
import { search as searchMethod } from '../lib/methods';
import { isGroupChat as isGroupChatMethod } from '../lib/methods/helpers';
import Chip from '../containers/Chip';
import { useAppSelector } from '../lib/hooks';

const ITEM_WIDTH = 250;
const getItemLayout = (_: any, index: number) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index });

type TRoute = RouteProp<ChatsStackParamList, 'SelectedUsersView'>;
type TNavigation = StackNavigationProp<ChatsStackParamList, 'SelectedUsersView'>;

type TSearchItem = ISearch | ISearchLocal;

const RenderSelectedItem = ({
	item,
	useRealName,
	onPressItem
}: {
	item: ISelectedUser;
	useRealName: boolean;
	onPressItem: (userItem: ISelectedUser) => void;
}) => {
	const name = useRealName && item.fname ? item.fname : item.name;
	const username = item.search ? (item.username as string) : item.name;

	return (
		<Chip
			item={item}
			text={name}
			avatar={username}
			onPress={() => onPressItem(item)}
			testID={`selected-user-${item.name}`}
			iconName={'close'}
		/>
	);
};

const Header = ({
	onChangeText,
	useRealName,
	onPressItem
}: {
	useRealName: boolean;
	onChangeText: (text: string) => void;
	onPressItem: (userItem: ISelectedUser) => void;
}) => {
	const flatlist = useRef<FlatList>();
	const { theme } = useTheme();
	const { users } = useAppSelector(state => ({
		users: state.selectedUsers.users
	}));

	const onContentSizeChange = () => flatlist?.current?.scrollToEnd({ animated: true });

	return (
		<View style={{ backgroundColor: themes[theme].backgroundColor }}>
			<SearchBox onChangeText={(text: string) => onChangeText(text)} testID='select-users-view-search' />
			{users.length === 0 ? null : (
				<View>
					<Text style={{ ...sharedStyles.textRegular, color: themes[theme].auxiliaryTintColor, marginLeft: 16 }}>
						{I18n.t('N_Selected_members', { n: users.length })}
					</Text>
					<FlatList
						data={users}
						ref={(ref: FlatList) => (flatlist.current = ref)}
						onContentSizeChange={onContentSizeChange}
						getItemLayout={getItemLayout}
						keyExtractor={item => item._id}
						renderItem={({ item }) => <RenderSelectedItem onPressItem={onPressItem} useRealName={useRealName} item={item} />}
						keyboardShouldPersistTaps='always'
						contentContainerStyle={{ paddingLeft: 16 }}
						horizontal
					/>
				</View>
			)}
		</View>
	);
};

const RenderItem = ({
	item,
	index,
	useRealName,
	searchLength,
	chatsLength,
	isChecked,
	onPressItem
}: {
	item: ISelectedUser;
	index: number;
	useRealName: boolean;
	searchLength: number;
	chatsLength: number;
	isChecked: (username: string) => boolean;
	onPressItem: (id: string, item?: ISelectedUser) => void;
}) => {
	const { theme } = useTheme();

	const name = useRealName && item.fname ? item.fname : item.name;
	const username = item.search ? (item.username as string) : item.name;
	let style = { borderColor: themes[theme].separatorColor };
	if (index === 0) {
		style = { ...style, ...sharedStyles.separatorTop };
	}
	if (searchLength > 0 && index === searchLength - 1) {
		style = { ...style, ...sharedStyles.separatorBottom };
	}
	if (searchLength === 0 && index === chatsLength - 1) {
		style = { ...style, ...sharedStyles.separatorBottom };
	}
	return (
		<UserItem
			name={name}
			username={username}
			onPress={() => onPressItem(item._id, item)}
			testID={`select-users-view-item-${item.name}`}
			icon={isChecked(username) ? 'checkbox-checked' : 'checkbox-unchecked'}
			iconColor={isChecked(username) ? themes[theme].actionTintColor : themes[theme].separatorColor}
			style={style}
			theme={theme}
		/>
	);
};

const SelectedUsersView = () => {
	const [chats, setChats] = useState<ISelectedUser[]>([]);
	const [search, setSearch] = useState<TSearchItem[]>([]);

	const { maxUsers, showButton, title, buttonText, nextAction } = useRoute<TRoute>().params;
	const navigation = useNavigation<TNavigation>();

	const { theme } = useTheme();
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

	const isChecked = useCallback((username: string) => users.findIndex(el => el.name === username) !== -1, [users]);

	const isGroupChat = () => maxUsers && maxUsers > 2;

	useLayoutEffect(() => {
		const titleHeader = title ?? I18n.t('Select_Users');
		const buttonTextHeader = buttonText ?? I18n.t('Next');
		const nextActionHeader = nextAction ?? (() => {});
		const options = {
			title: titleHeader,
			headerRight: () =>
				(!maxUsers || showButton || (isGroupChat() && users.length > 1)) && (
					<HeaderButton.Container>
						<HeaderButton.Item
							title={users.length > 0 ? buttonTextHeader : I18n.t('Skip')}
							onPress={nextActionHeader}
							testID='selected-users-view-submit'
						/>
					</HeaderButton.Container>
				)
		};
		navigation.setOptions(options);
	}, [users, maxUsers]);

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

	const _onPressItem = (id: string, item = {} as ISelectedUser) => {
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
				renderItem={({ item, index }) => (
					<RenderItem
						isChecked={isChecked}
						chatsLength={chats.length}
						searchLength={search.length}
						index={index}
						item={item}
						useRealName={useRealName}
						onPressItem={_onPressItem}
					/>
				)}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={<Header useRealName={useRealName} onChangeText={handleSearch} onPressItem={toggleUser} />}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
			<Loading visible={loading} />
		</SafeAreaView>
	);
};

export default SelectedUsersView;
