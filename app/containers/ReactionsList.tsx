import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';

import Emoji from './message/Emoji';
import { useTheme } from '../theme';
import { TGetCustomEmoji } from '../definitions/IEmoji';
import { IReaction, IApplicationState } from '../definitions';
import Avatar from './Avatar';
import sharedStyles from '../views/Styles';
import I18n from '../i18n';

const MIN_TAB_WIDTH = 70;

const styles = StyleSheet.create({
	reactionsListContainer: { height: '100%', width: '100%' },
	allReactionsContainer: { height: '100%', width: '100%', paddingTop: 5 },
	tabBarItem: {
		paddingHorizontal: 10,
		paddingBottom: 10,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row'
	},
	reactionCount: { marginLeft: 5 },
	emojiName: { margin: 10 },
	userItemContainer: { marginHorizontal: 10, marginVertical: 5, flexDirection: 'row' },
	textContainer: { marginHorizontal: 10, justifyContent: 'center' },
	usernameText: { fontSize: 17, ...sharedStyles.textMedium },
	standardEmojiStyle: { fontSize: 20, color: '#fff' },
	customEmojiStyle: { width: 25, height: 25 },
	allTabStandardEmojiStyle: { fontSize: 28, color: '#fff' },
	allTabCustomEmojiStyle: { width: 32, height: 32 },
	allListItemContainer: { paddingHorizontal: 10, marginVertical: 5, flexDirection: 'row', alignItems: 'center' },
	peopleReactedContainer: { marginHorizontal: 20 }
});

interface IReactionsListBase {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
}

interface IReactionsListProps extends IReactionsListBase {
	reactions?: IReaction[];
	width: number;
	username: string;
}

interface ITabBarItem extends IReactionsListBase {
	tab: IReaction;
	index: number;
	goToPage?: (index: number) => void;
}
interface IReactionsTabBar extends IReactionsListBase {
	activeTab?: number;
	tabs?: IReaction[];
	goToPage?: (index: number) => void;
	width: number;
}

interface IAllReactionsListItemProps extends IReactionsListBase {
	item: IReaction;
	username: string;
}

interface IAllTabProps extends IReactionsListBase {
	tabLabel: IReaction;
	reactions?: IReaction[];
	username: string;
}

const TabBarItem = ({ tab, index, goToPage, baseUrl, getCustomEmoji }: ITabBarItem) => {
	const { colors } = useTheme();
	return (
		<Pressable
			key={tab.emoji}
			onPress={() => {
				goToPage?.(index);
			}}
			style={({ pressed }: { pressed: boolean }) => ({
				opacity: pressed ? 0.7 : 1
			})}
		>
			<View style={styles.tabBarItem}>
				{tab._id === 'All' ? (
					<Text style={{ color: colors.auxiliaryTintColor, fontSize: 18 }}>{I18n.t('All')}</Text>
				) : (
					<>
						<Emoji
							content={tab.emoji}
							standardEmojiStyle={styles.standardEmojiStyle}
							customEmojiStyle={styles.customEmojiStyle}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji}
						/>
						<Text style={[styles.reactionCount, { color: colors.auxiliaryTintColor }]}>{tab.usernames.length}</Text>
					</>
				)}
			</View>
		</Pressable>
	);
};

const ReactionsTabBar = ({ tabs, activeTab, goToPage, baseUrl, getCustomEmoji, width }: IReactionsTabBar) => {
	const tabWidth = tabs && Math.max(width / tabs.length, MIN_TAB_WIDTH);
	const { colors } = useTheme();
	return (
		<View>
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				{tabs?.map((tab, index) => {
					const isActiveTab = activeTab === index;
					return (
						<View
							style={{
								width: tabWidth,
								borderBottomWidth: isActiveTab ? 2 : 1,
								borderColor: isActiveTab ? colors.tintActive : colors.separatorColor
							}}
						>
							<TabBarItem tab={tab} index={index} goToPage={goToPage} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} />
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
};

const UsersList = ({ tabLabel }: { tabLabel: IReaction }) => {
	const { colors } = useTheme();
	const { emoji, usernames, names } = tabLabel;
	const users =
		names?.length > 0
			? usernames.map((username, index) => ({ username, name: names[index] }))
			: usernames.map(username => ({ username, name: '' }));

	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);

	return (
		<FlatList
			data={users}
			ListHeaderComponent={() => (
				<View style={styles.emojiName}>
					<Text style={{ color: colors.auxiliaryTintColor }}>{emoji}</Text>
				</View>
			)}
			renderItem={({ item }) => (
				<View style={styles.userItemContainer}>
					<Avatar text={item.username} size={36} />
					<View style={styles.textContainer}>
						<Text style={[styles.usernameText, { color: colors.titleText }]} numberOfLines={1}>
							{useRealName && item.name ? item.name : item.username}
						</Text>
					</View>
				</View>
			)}
			keyExtractor={item => item.username}
		/>
	);
};

const AllReactionsListItem = ({ item, baseUrl, getCustomEmoji, username }: IAllReactionsListItemProps) => {
	const { colors } = useTheme();
	const count = item.usernames.length;
	let usernames = item.usernames
		.slice(0, 3)
		.map((otherUsername: string) => (username === otherUsername ? I18n.t('you') : otherUsername))
		.join(', ');
	if (count > 3) {
		usernames = `${usernames} ${I18n.t('and_more')} ${count - 3}`;
	} else {
		usernames = usernames.replace(/,(?=[^,]*$)/, ` ${I18n.t('and')}`);
	}
	return (
		<View style={styles.allListItemContainer}>
			<Emoji
				content={item.emoji}
				standardEmojiStyle={styles.allTabStandardEmojiStyle}
				customEmojiStyle={styles.allTabCustomEmojiStyle}
				baseUrl={baseUrl}
				getCustomEmoji={getCustomEmoji}
			/>
			<View style={styles.peopleReactedContainer}>
				<Text style={{ color: colors.titleText }}>
					{count === 1 ? I18n.t('1_person_reacted') : I18n.t('N_people_reacted', { n: count })}
				</Text>
				<Text style={[{ color: colors.auxiliaryTintColor }]}>{usernames}</Text>
			</View>
		</View>
	);
};

const AllTab = ({ reactions, baseUrl, getCustomEmoji, username }: IAllTabProps) => (
	<View style={styles.allReactionsContainer}>
		<FlatList
			data={reactions}
			renderItem={({ item }) => (
				<AllReactionsListItem item={item} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} username={username} />
			)}
			keyExtractor={item => item.emoji}
		/>
	</View>
);

const ReactionsList = ({ reactions, baseUrl, getCustomEmoji, width, username }: IReactionsListProps): React.ReactElement => {
	// sorting reactions in descending order on the basic of number of users reacted
	const sortedReactions = reactions?.sort((reaction1, reaction2) => reaction2.usernames.length - reaction1.usernames.length);
	const allTabLabel = { emoji: I18n.t('All'), usernames: [], names: [], _id: 'All' };
	return (
		<View style={styles.reactionsListContainer}>
			<ScrollableTabView renderTabBar={() => <ReactionsTabBar baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} width={width} />}>
				<AllTab
					tabLabel={allTabLabel}
					reactions={sortedReactions}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
					username={username}
				/>
				{sortedReactions?.map(reaction => (
					<UsersList tabLabel={reaction} key={reaction.emoji} />
				))}
			</ScrollableTabView>
		</View>
	);
};

export default ReactionsList;
