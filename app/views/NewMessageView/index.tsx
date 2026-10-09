import { Q } from '@nozbe/watermelondb';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { shallowEqual } from 'react-redux';
import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityIndicator from '~/containers/ActivityIndicator';
import { headerLeftCloseModal } from '~/lib/methods/helpers/navigation/headerActions';
import * as List from '~/containers/List';
import SafeAreaView from '~/containers/SafeAreaView';
import { type ISearch, type TSubscriptionModel } from '~/definitions';
import I18n from '~/i18n';
import database from '~/lib/database';
import { useTheme } from '~/theme';
import { goRoom as goRoomMethod, type TGoRoomItem } from '~/lib/methods/helpers/goRoom';
import log, { events, logEvent } from '~/lib/methods/helpers/log';
import { type NewMessageStackParamList } from '~/stacks/types';
import { search as runSearch } from '~/lib/methods/search';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import RowSeparator from '~/containers/NativeListRow/components/Separator';
import { useListBackgroundColor } from '~/containers/NativeListRow/hooks/useListBackgroundColor';
import Item from './Item';
import HeaderNewMessage from './HeaderNewMessage';
import { getUidDirectMessage } from '~/lib/methods/helpers/helpers';
import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';

const QUERY_SIZE = 50;

type TItem = ISearch | TSubscriptionModel;

export type NewMessageViewParams = { categoryId?: string } | undefined;

const filterChatsByName = (chats: TSubscriptionModel[], text: string) => {
	const lowerCaseText = text.toLowerCase();
	return chats.filter(chat => [chat.name, chat.fname].some(name => name?.toLowerCase().includes(lowerCaseText)));
};

const NewMessageView = ({ route }: StaticScreenProps<NewMessageViewParams>) => {
	const categoryId = route.params?.categoryId;
	const categoryName = useSidebarCategories().customCategoryNames.get(categoryId ?? '');
	const [chats, setChats] = useState<TSubscriptionModel[]>([]);
	const [search, setSearch] = useState<TItem[]>([]);
	const [categorySearchText, setCategorySearchText] = useState('');
	// True while the remote (spotlight) request is in flight, after local results are already painted
	const [searching, setSearching] = useState(false);
	// Guards against an older (slower) search overwriting the results of a newer one
	const searchId = useRef(0);

	const { colors } = useTheme();
	const listBackgroundColor = useListBackgroundColor(colors.surfaceTint);

	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();
	const { bottom } = useSafeAreaInsets();

	const { maxUsers, useRealName } = useAppSelector(
		state => ({
			maxUsers: (state.settings.DirectMesssage_maxUsers as number) || 1,
			useRealName: state.settings.UI_Use_Real_Name as boolean
		}),
		shallowEqual
	);
	const isMasterDetail = useMasterDetail();

	useLayoutEffect(() => {
		navigation.setOptions({
			...headerLeftCloseModal(navigation, 'new-message-view-close'),
			title: categoryName ? I18n.t('Create_New_In_Category', { name: categoryName }) : I18n.t('Create_New')
		});
	}, [navigation, categoryName]);

	useEffect(() => {
		const init = async () => {
			try {
				const db = database.active;
				const scope = categoryId ? Q.where('category', categoryId) : Q.take(QUERY_SIZE);
				const c = await db.get('subscriptions').query(Q.where('t', 'd'), scope, Q.sortBy('room_updated_at', Q.desc)).fetch();
				setChats(c);
			} catch (e) {
				log(e);
			}
		};

		init();
	}, [categoryId]);

	const handleSearch = useCallback(async (text: string) => {
		searchId.current += 1;
		const currentSearchId = searchId.current;
		const isStale = () => currentSearchId !== searchId.current;

		setSearching(true);

		try {
			// Paint local results immediately while the backend request is still in flight
			const result = (await runSearch({
				text,
				filterRooms: false,
				onLocal: localData => {
					if (isStale()) return;
					setSearch(localData as ISearch[]);
				}
			})) as ISearch[];
			if (!isStale()) setSearch(result);
		} catch (e) {
			log(e);
		}
		if (!isStale()) setSearching(false);
	}, []);

	const goRoom = useCallback(
		(item: TGoRoomItem) => {
			logEvent(events.NEW_MSG_CHAT_WITH_USER);
			navigation.pop();
			goRoomMethod({ item, isMasterDetail });
		},
		[isMasterDetail, navigation]
	);

	const globalChats = search.length > 0 ? search : chats;
	const listedChats = categoryId ? filterChatsByName(chats, categorySearchText) : globalChats;

	return (
		<SafeAreaView testID='new-message-view'>
			<FlatList
				data={listedChats}
				keyExtractor={item => item._id || item.rid}
				ListHeaderComponent={
					<HeaderNewMessage
						maxUsers={maxUsers}
						onChangeText={categoryId ? setCategorySearchText : handleSearch}
						categoryId={categoryId}
						categoryName={categoryName}
					/>
				}
				renderItem={({ item, index }) => {
					const itemSearch = item as ISearch;
					const itemModel = item as TSubscriptionModel;
					const userId = itemSearch.search ? itemSearch._id : getUidDirectMessage(itemModel);

					return (
						<Item
							userId={userId}
							name={useRealName && itemSearch.fname ? itemSearch.fname : itemModel.name}
							username={itemSearch.search ? itemSearch.username : itemModel.name}
							onPress={() => goRoom(itemModel)}
							testID={`new-message-view-item-${item.name}`}
							isFirst={index === 0}
							isLast={index === listedChats.length - 1}
						/>
					);
				}}
				ItemSeparatorComponent={RowSeparator}
				ListFooterComponent={searching ? () => <ActivityIndicator /> : List.Separator}
				style={{ backgroundColor: listBackgroundColor }}
				contentContainerStyle={{ paddingBottom: bottom }}
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default NewMessageView;
