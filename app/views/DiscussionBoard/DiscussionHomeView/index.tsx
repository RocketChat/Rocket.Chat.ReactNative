import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import * as HeaderButton from '../../../containers/HeaderButton';
import { MESSAGE_TYPE_ANY_LOAD, SortBy, themes } from '../../../lib/constants';
import { useTheme, withTheme } from '../../../theme';
import { IApplicationState } from '../../../definitions';
import DiscussionBoardCard from '../Components/DiscussionBoardCard';
import DiscussionPostCard from '../Components/DiscussionPostCard';
import Header from '../Components/Header';
import { DiscussionTabs } from './interaces';
import styles from './styles';
import { messageTypesToRemove } from '../data';
import { getRoomAvatar, isGroupChat } from '../../../lib/methods/helpers';
import { loadMissedMessages } from '../../../lib/methods';
import moment from 'moment';
import { handleStar } from '../helpers';

// const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;
// const CHATS_HEADER = 'Chats';
// const UNREAD_HEADER = 'Unread';
// const FAVORITES_HEADER = 'Favorites';
// const DISCUSSIONS_HEADER = 'Discussions';
// const TEAMS_HEADER = 'Teams';
// const CHANNELS_HEADER = 'Channels';
// const DM_HEADER = 'Direct_Messages';
// const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
// const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const QUERY_SIZE = 20;
const VIRTUAL_HAPPY_HOUR = {
	ROOM_RID: 'jRXA42HyPKpjAmZpX'
}

const DiscussionHomeView: React.FC = ({ route }) => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const { sortBy, showUnread, showFavorites, groupByType } = useSelector((state: IApplicationState) => state.sortPreferences);
	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);

	const [selectedTab, setSelectedTab] = useState(DiscussionTabs.DISCUSSION_BOARDS);
	const [searchCount, setSearchCount] = useState(0);
	const [boards, setBoards] = useState([]);
	const [starredPosts, setStarredPosts] = useState([]);
	const isFocused = useIsFocused();
	const db = database.active;
	// const { theme } = useTheme();
	const theme = 'light';

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => (
					<View style={{ marginLeft: 8 }}>
						<HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' color={themes[theme].superGray} />
					</View>
				),
				headerRight: () => (
					<View style={{ marginRight: 8 }}>
						<HeaderButton.Container>
							<HeaderButton.Item
								iconName='search'
								color={themes[theme].superGray}
								onPress={() => navigation.navigate('DiscussionSearchView', { roomIDs: boards.map((board: any) => board.id)})}
							/>
						</HeaderButton.Container>
					</View>
				)
			});
		}
	});

	useEffect(() => {
		if (isFocused && selectedTab === DiscussionTabs.SAVED_POSTS) {
			getSavedChat();
		}
	}, [isFocused]);

	useEffect(() => {
		const getSubscriptions = async () => {
			const isGrouping = showUnread || showFavorites || groupByType;
			let observable;

			const defaultWhereClause = [Q.where('archived', false), Q.where('open', true)];

			if (sortBy === SortBy.Alphabetical) {
				defaultWhereClause.push(Q.experimentalSortBy(`${useRealName ? 'fname' : 'name'}`, Q.asc));
			} else {
				defaultWhereClause.push(Q.experimentalSortBy('room_updated_at', Q.desc));
			}

			// When we're grouping by something
			if (isGrouping) {
				observable = await db
					.get('subscriptions')
					.query(...defaultWhereClause)
					.observeWithColumns(['alert', 'on_hold']);
				// When we're NOT grouping
			} else {
				setSearchCount(searchCount + QUERY_SIZE);
				observable = await db
					.get('subscriptions')
					.query(...defaultWhereClause, Q.experimentalSkip(0), Q.experimentalTake(searchCount))
					.observeWithColumns(['on_hold']);
			}

			observable.subscribe(data => {
				const formattedData = data.map(d => {
					const jsonObject = {
						...d,
						title: d.fname,
						description: d.topic,
						_raw: { ...d._raw, uids: JSON.parse(d._raw.uids), usernames: JSON.parse(d._raw.usernames) },
						...d._raw,
						uids: JSON.parse(d._raw.uids),
						usernames: JSON.parse(d._raw.usernames),
						usersCount: JSON.parse(d._raw.users_count)
					};

					return {
						...jsonObject,
						avatar: getRoomAvatar(jsonObject),
						isGrouChat: isGroupChat(jsonObject)
					};
				});

				const boards = formattedData.filter(d => {
					// removing direct messages
					return d.t !== 'd' && d.id !== 'GENERAL' && (d.rid !== VIRTUAL_HAPPY_HOUR.ROOM_RID);
					// return true;
				});

				setBoards(boards);
			});
		};

		getSubscriptions();
	}, [isFocused]);

	const getSavedChat = async () => {
		const messagesObservable = db
			.get('messages')
			.query(Q.where('starred', true), Q.experimentalSortBy('ts', Q.desc), Q.experimentalSkip(0))
			.observe();

		messagesObservable?.subscribe(messages => {
			// filter out messages
			messages = messages.filter(m => {
				return !(MESSAGE_TYPE_ANY_LOAD.includes(m.t) || messageTypesToRemove.includes(m.t));
			});

			const formattedData = messages.map(m => {
				let object = { ...m };
				try {
					if (m?._raw?.u?.length && m._raw.u.length > 0 && m._raw.u !== '[]') {
						object._raw.u = JSON.parse(m._raw.u);
					}
					if (m?._raw?.attachments?.length && m._raw.attachments.length > 0) {
						object._raw.attachments = JSON.parse(m._raw.attachments);
					}
					if (m?._raw?.replies?.length && m._raw.replies.length > 0 && m._raw.replies !== '[]') {
						object._raw.replies = JSON.parse(m._raw.replies);
					}
					if (m?._raw?.reactions?.length && m._raw.reactions.length > 0 && m._raw.reactions !== '[]') {
						object._raw.reactions = JSON.parse(m._raw.reactions);
					}
				} catch (error) {}

				return object;
			});

			setStarredPosts(formattedData);
		});
	};

	// get starred posts
	useEffect(() => {
		if (selectedTab === DiscussionTabs.SAVED_POSTS) {
			getSavedChat();
		}
	}, [selectedTab]);

	const content = () => (
		<View style={{ width: '100%' }}>
			{selectedTab === DiscussionTabs.DISCUSSION_BOARDS && (
				<FlatList
					data={boards}
					renderItem={({ item }) => (
						<DiscussionBoardCard item={item} onPress={() => navigation.navigate('DiscussionBoardView', { item, boards })} />
					)}
					keyExtractor={(item, id) => item.title + id}
					ItemSeparatorComponent={() => <View style={styles.discussionBoardsSeparator} />}
					style={{ padding: 20 }}
					ListFooterComponent={<View style={styles.footer} />}
				/>
			)}
			{selectedTab === DiscussionTabs.SAVED_POSTS && (
				<FlatList
					data={starredPosts}
					renderItem={({ item }) => (
						<DiscussionPostCard
							{...item}
							onPress={(params: any) => navigation.navigate('DiscussionPostView', params)}
							starPost={(message: any) =>
								handleStar(message, async () => {
									await loadMissedMessages({ rid: message.rid, lastOpen: moment().subtract(7, 'days').toDate() });
									getSavedChat();
								})
							}
						/>
					)}
					keyExtractor={(item, id) => item.title + id}
					ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
					style={{ padding: 20 }}
					ListFooterComponent={<View style={styles.footer} />}
				/>
			)}
		</View>
	);

	return (
		<View style={styles.mainContainer}>
			<Header onTabChange={(tab: DiscussionTabs) => setSelectedTab(tab)} />
			{content()}
		</View>
	);
};

export default withTheme(DiscussionHomeView);
